'use strict';

const wordsLib = require('./words');

/**
 * 🎨 ओळखा पाहू! 👀 – Draw & Guess Battle
 * Room & Game State Manager
 */

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(existingRooms) {
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
    }
    if (!existingRooms.has(code)) return code;
  }
  return 'MAZA' + Math.floor(Math.random() * 100);
}

class Room {
  constructor(code, hostPlayer, options = {}) {
    this.code = code;
    this.createdAt = Date.now();
    this.state = 'LOBBY'; // 'LOBBY' | 'SELECTING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER'

    // Settings
    this.roundTime = options.roundTime || 80; // 80 seconds per requirements
    this.maxRounds = options.maxRounds || 3;
    this.wordPack = options.wordPack || 'all';

    // Players: Map of sessionToken -> Player
    this.players = new Map();
    // Socket to session mapping: Map of socketId -> sessionToken
    this.socketToSession = new Map();

    // Turn tracking
    this.round = 1;
    this.drawerIndex = 0;
    this.drawerOrder = [];
    this.currentDrawerToken = null;

    // Word state
    this.currentWord = null;
    this.wordChoices = [];
    this.revealedHintLevel = 0; // 0: none, 1: category & 1 letter, 2: more letters

    // Drawing canvas state
    this.strokes = [];
    this.undoStack = [];

    // Timer & loop
    this.timeLeft = this.roundTime;
    this.timer = null;
    this.phaseEndTime = 0;

    // Chat history (latest 50)
    this.messages = [];

    // Add host
    this.addPlayer(hostPlayer, true);
  }

  addPlayer(playerData, isHost = false) {
    const sessionToken = playerData.sessionToken || 's_' + Math.random().toString(36).slice(2, 10);
    const existing = this.players.get(sessionToken);

    if (existing) {
      existing.connected = true;
      existing.socketId = playerData.socketId;
      existing.name = playerData.name || existing.name;
      existing.avatar = playerData.avatar || existing.avatar;
      this.socketToSession.set(playerData.socketId, sessionToken);
      return existing;
    }

    const player = {
      sessionToken,
      socketId: playerData.socketId,
      name: (playerData.name || 'खेळाडू').trim().slice(0, 16),
      avatar: playerData.avatar || '👨‍🎨',
      score: 0,
      roundScore: 0,
      hasGuessed: false,
      guessTime: 0,
      isHost: isHost || this.players.size === 0,
      ready: true,
      connected: true,
      joinedAt: Date.now()
    };

    this.players.set(sessionToken, player);
    this.socketToSession.set(playerData.socketId, sessionToken);
    return player;
  }

  removePlayer(socketId) {
    const sessionToken = this.socketToSession.get(socketId);
    if (!sessionToken) return null;
    this.socketToSession.delete(socketId);

    const player = this.players.get(sessionToken);
    if (!player) return null;

    player.connected = false;

    // If game is in LOBBY, we can delete disconnected player after a short grace period
    if (this.state === 'LOBBY') {
      this.players.delete(sessionToken);
      // Reassign host if host left
      if (player.isHost && this.players.size > 0) {
        const nextHost = this.players.values().next().value;
        if (nextHost) nextHost.isHost = true;
      }
    } else {
      // If currently the drawer disconnected, end turn early
      if (this.currentDrawerToken === sessionToken && (this.state === 'DRAWING' || this.state === 'SELECTING_WORD')) {
        this.endTurn('drawer_left');
      }
    }

    return player;
  }

  getPlayerBySocket(socketId) {
    const token = this.socketToSession.get(socketId);
    return token ? this.players.get(token) : null;
  }

  getConnectedPlayers() {
    return Array.from(this.players.values()).filter(p => p.connected);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  canStart() {
    return this.state === 'LOBBY' && this.getConnectedPlayers().length >= 2;
  }

  startGame() {
    if (!this.canStart()) return false;

    this.state = 'SELECTING_WORD';
    this.round = 1;
    this.drawerIndex = 0;
    this.drawerOrder = this.getConnectedPlayers().map(p => p.sessionToken);
    // Shuffle drawer order
    this.drawerOrder.sort(() => 0.5 - Math.random());

    // Reset scores
    for (const p of this.players.values()) {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
    }

    this.startDrawerTurn();
    return true;
  }

  startDrawerTurn() {
    if (this.drawerIndex >= this.drawerOrder.length) {
      // Completed a full round of drawers
      this.round += 1;
      this.drawerIndex = 0;
      if (this.round > this.maxRounds) {
        this.endGame();
        return;
      }
    }

    this.currentDrawerToken = this.drawerOrder[this.drawerIndex];
    const drawer = this.players.get(this.currentDrawerToken);

    // If drawer is disconnected, skip to next
    if (!drawer || !drawer.connected) {
      this.drawerIndex++;
      this.startDrawerTurn();
      return;
    }

    // Reset turn flags
    for (const p of this.players.values()) {
      p.hasGuessed = false;
      p.roundScore = 0;
      p.guessTime = 0;
    }

    // Clear canvas
    this.strokes = [];
    this.undoStack = [];
    this.revealedHintLevel = 0;

    // Pick 3 words for drawer
    this.wordChoices = wordsLib.getRandomChoices(3, this.wordPack);
    this.state = 'SELECTING_WORD';
    this.timeLeft = 15; // 15 seconds to pick word
    this.phaseEndTime = Date.now() + 15000;

    this.clearTimer();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  selectWord(sessionToken, wordId) {
    if (this.state !== 'SELECTING_WORD') return false;
    if (this.currentDrawerToken !== sessionToken) return false;

    let selected = this.wordChoices.find(w => w.id === wordId);
    if (!selected) {
      selected = this.wordChoices[0];
    }
    this.beginDrawingPhase(selected);
    return true;
  }

  beginDrawingPhase(selectedWord) {
    this.currentWord = selectedWord;
    this.state = 'DRAWING';
    this.timeLeft = this.roundTime; // 80 seconds
    this.phaseEndTime = Date.now() + this.roundTime * 1000;
    this.revealedHintLevel = 0;

    this.clearTimer();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  tick() {
    this.timeLeft = Math.max(0, Math.round((this.phaseEndTime - Date.now()) / 1000));

    if (this.state === 'SELECTING_WORD') {
      if (this.timeLeft <= 0) {
        // Auto pick first word
        this.beginDrawingPhase(this.wordChoices[0] || wordsLib.getRandomChoices(1)[0]);
        if (this.onStateChange) this.onStateChange('word_auto_selected');
      } else {
        if (this.onTick) this.onTick(this.timeLeft);
      }
      return;
    }

    if (this.state === 'DRAWING') {
      // Hint progression:
      // At <= 50s left: Hint 1 (Category & 1st letter)
      if (this.timeLeft <= 50 && this.revealedHintLevel < 1) {
        this.revealedHintLevel = 1;
        if (this.onHint) this.onHint(1);
      }
      // At <= 25s left: Hint 2 (More letters)
      if (this.timeLeft <= 25 && this.revealedHintLevel < 2) {
        this.revealedHintLevel = 2;
        if (this.onHint) this.onHint(2);
      }

      if (this.timeLeft <= 0) {
        this.endTurn('time_up');
      } else {
        if (this.onTick) this.onTick(this.timeLeft);
      }
    }
  }

  endTurn(reason = 'time_up') {
    this.clearTimer();
    this.state = 'ROUND_END';
    this.timeLeft = 5; // 5-second reveal cooldown
    this.phaseEndTime = Date.now() + 5000;

    // Drawer bonus: 75 pts for every guesser who guessed
    const drawer = this.players.get(this.currentDrawerToken);
    const guesserCount = Array.from(this.players.values()).filter(p => p.hasGuessed).length;
    if (drawer && guesserCount > 0) {
      const drawerBonus = guesserCount * 75;
      drawer.roundScore += drawerBonus;
      drawer.score += drawerBonus;
    }

    if (this.onTurnEnd) this.onTurnEnd(reason);

    this.timer = setTimeout(() => {
      this.drawerIndex++;
      this.startDrawerTurn();
      if (this.onStateChange) this.onStateChange('next_turn');
    }, 5000);
  }

  endGame() {
    this.clearTimer();
    this.state = 'GAME_OVER';
    if (this.onGameOver) this.onGameOver();
  }

  resetToLobby() {
    this.clearTimer();
    this.state = 'LOBBY';
    this.round = 1;
    this.drawerIndex = 0;
    this.currentDrawerToken = null;
    this.currentWord = null;
    this.strokes = [];
    this.undoStack = [];
    for (const p of this.players.values()) {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
    }
    if (this.onStateChange) this.onStateChange('reset_lobby');
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // --- Drawing Actions ---
  addStroke(stroke) {
    // Expect normalized points [[x, y], ...] where x, y are in [0.0 .. 1.0]
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    this.strokes.push(stroke);
    this.undoStack = []; // Clear redo on new stroke
  }

  appendStrokePoint(strokeId, point) {
    const stroke = this.strokes.find(s => s.id === strokeId);
    if (stroke && stroke.points) {
      stroke.points.push(point);
    }
  }

  undoStroke() {
    if (this.strokes.length === 0) return null;
    const removed = this.strokes.pop();
    this.undoStack.push(removed);
    return removed;
  }

  redoStroke() {
    if (this.undoStack.length === 0) return null;
    const restored = this.undoStack.pop();
    this.strokes.push(restored);
    return restored;
  }

  clearCanvas() {
    this.strokes = [];
    this.undoStack = [];
  }

  // --- Guessing & Chat ---
  handleGuess(sessionToken, text) {
    const player = this.players.get(sessionToken);
    if (!player) return { type: 'ignored' };

    const cleanMsg = (text || '').trim();
    if (!cleanMsg) return { type: 'ignored' };

    // If game is not in drawing state, it's just regular chat
    if (this.state !== 'DRAWING' || !this.currentWord) {
      return { type: 'chat', player, text: cleanMsg, isSpectator: false };
    }

    // Current drawer cannot guess
    if (sessionToken === this.currentDrawerToken) {
      return { type: 'drawer_chat', player, text: cleanMsg };
    }

    // Player already guessed correctly
    if (player.hasGuessed) {
      return { type: 'guessed_chat', player, text: cleanMsg };
    }

    // Check if match
    const isCorrect = wordsLib.isMatch(cleanMsg, this.currentWord);

    if (isCorrect) {
      player.hasGuessed = true;
      player.guessTime = this.timeLeft;

      // Calculate score: 300 base + up to 200 time bonus
      const timeBonus = Math.round(200 * (Math.max(1, this.timeLeft) / this.roundTime));
      // First guesser bonus
      const otherGuesses = Array.from(this.players.values()).filter(p => p.hasGuessed && p !== player).length;
      const firstBonus = otherGuesses === 0 ? 50 : 0;
      const points = 300 + timeBonus + firstBonus;

      player.roundScore = points;
      player.score += points;

      // Check if all guessers have guessed
      const guessers = this.getConnectedPlayers().filter(p => p.sessionToken !== this.currentDrawerToken);
      const allGuessed = guessers.every(p => p.hasGuessed);

      if (allGuessed) {
        // End round early after 2 seconds
        this.clearTimer();
        this.timer = setTimeout(() => {
          this.endTurn('all_guessed');
        }, 2000);
      }

      return {
        type: 'correct',
        player,
        points,
        allGuessed,
        guessedCount: guessers.filter(p => p.hasGuessed).length,
        totalGuessers: guessers.length
      };
    }

    // Check if close
    const isClose = wordsLib.isClose(cleanMsg, this.currentWord);
    if (isClose) {
      return { type: 'close', player, text: cleanMsg };
    }

    return { type: 'chat', player, text: cleanMsg, isSpectator: false };
  }

  // --- Serialization for Client ---
  getPublicState(viewerSessionToken) {
    const isDrawer = viewerSessionToken === this.currentDrawerToken;
    const player = this.players.get(viewerSessionToken);
    const hasGuessed = player ? player.hasGuessed : false;

    // Word display
    let wordInfo = null;
    if (this.currentWord) {
      if (isDrawer || this.state === 'ROUND_END' || this.state === 'GAME_OVER') {
        // Drawer sees full word
        wordInfo = {
          mr: this.currentWord.mr,
          en: this.currentWord.en,
          category: this.currentWord.category,
          categoryEn: this.currentWord.categoryEn,
          hint: this.currentWord.hint,
          isFull: true
        };
      } else {
        // Guessers see masked word
        const revealRatio = this.revealedHintLevel === 1 ? 0.25 : this.revealedHintLevel === 2 ? 0.5 : 0;
        const maskedMr = wordsLib.maskWord(this.currentWord, revealRatio, 'mr');
        const maskedEn = wordsLib.maskWord(this.currentWord, revealRatio, 'en');

        wordInfo = {
          maskedMr: maskedMr.masked,
          maskedEn: maskedEn.masked,
          letterCount: maskedMr.letterCount,
          category: this.revealedHintLevel >= 1 ? this.currentWord.category : null,
          categoryEn: this.revealedHintLevel >= 1 ? this.currentWord.categoryEn : null,
          isFull: false
        };
      }
    }

    const currentDrawer = this.players.get(this.currentDrawerToken);

    return {
      code: this.code,
      state: this.state,
      round: this.round,
      maxRounds: this.maxRounds,
      roundTime: this.roundTime,
      wordPack: this.wordPack,
      timeLeft: this.timeLeft,
      currentDrawer: currentDrawer ? {
        sessionToken: currentDrawer.sessionToken,
        name: currentDrawer.name,
        avatar: currentDrawer.avatar
      } : null,
      isDrawer,
      hasGuessed,
      wordInfo,
      wordChoices: isDrawer && this.state === 'SELECTING_WORD' ? this.wordChoices : null,
      players: this.getAllPlayers().map(p => ({
        sessionToken: p.sessionToken,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        roundScore: p.roundScore,
        hasGuessed: p.hasGuessed,
        isHost: p.isHost,
        connected: p.connected,
        isCurrentDrawer: p.sessionToken === this.currentDrawerToken
      })),
      canStart: this.canStart()
    };
  }
}

class GameHub {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostPlayer, options = {}) {
    const code = generateRoomCode(this.rooms);
    const room = new Room(code, hostPlayer, options);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase().trim()) || null;
  }

  cleanInactiveRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      const activePlayers = room.getConnectedPlayers();
      // Remove room if empty for more than 15 minutes
      if (activePlayers.length === 0 && now - room.createdAt > 15 * 60 * 1000) {
        room.clearTimer();
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = {
  Room,
  GameHub
};
