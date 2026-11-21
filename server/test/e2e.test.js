'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const { GameHub } = require('../game');
const wordsLib = require('../words');

// Setup test server
function setupTestServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  const hub = new GameHub();

  function broadcastRoomState(room) {
    for (const [socketId, sessionToken] of room.socketToSession.entries()) {
      const clientState = room.getPublicState(sessionToken);
      io.to(socketId).emit('room_state', clientState);
    }
  }

  function wireRoomEvents(room) {
    room.onTick = (timeLeft) => {
      io.to(room.code).emit('timer_tick', { timeLeft });
    };
    room.onHint = (hintLevel) => {
      broadcastRoomState(room);
      io.to(room.code).emit('hint_unlocked', {
        hintLevel,
        category: room.currentWord ? room.currentWord.category : null,
        categoryEn: room.currentWord ? room.currentWord.categoryEn : null
      });
    };
    room.onTurnEnd = (reason) => {
      io.to(room.code).emit('draw_clear');
      broadcastRoomState(room);
      io.to(room.code).emit('turn_ended', {
        reason,
        word: room.currentWord,
        scores: room.getAllPlayers().map(p => ({
          sessionToken: p.sessionToken,
          name: p.name,
          score: p.score,
          roundScore: p.roundScore,
          hasGuessed: p.hasGuessed
        }))
      });
    };
    room.onGameOver = () => {
      io.to(room.code).emit('draw_clear');
      broadcastRoomState(room);
      const leaderboard = room.getAllPlayers()
        .map(p => ({ sessionToken: p.sessionToken, name: p.name, avatar: p.avatar, score: p.score }))
        .sort((a, b) => b.score - a.score);
      io.to(room.code).emit('game_over', { leaderboard });
    };
    room.onStateChange = (event) => {
      if (event === 'next_turn' || event === 'word_auto_selected' || event === 'reset_lobby') {
        io.to(room.code).emit('draw_clear');
      }
      broadcastRoomState(room);
    };
  }

  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentSessionToken = null;

    socket.on('create_room', (data, ack) => {
      const room = hub.createRoom({
        socketId: socket.id,
        sessionToken: data?.sessionToken || 's_host',
        name: data?.name || 'होस्ट',
        avatar: data?.avatar || '👨‍🎨'
      }, data?.options);
      wireRoomEvents(room);
      currentRoomCode = room.code;
      currentSessionToken = room.players.values().next().value.sessionToken;
      socket.join(room.code);
      if (ack) ack({ ok: true, roomCode: room.code, sessionToken: currentSessionToken, state: room.getPublicState(currentSessionToken) });
      broadcastRoomState(room);
    });

    socket.on('join_room', (data, ack) => {
      const room = hub.getRoom(data?.roomCode);
      if (!room) {
        if (ack) ack({ ok: false, error: 'Not found' });
        return;
      }
      const player = room.addPlayer({
        socketId: socket.id,
        sessionToken: data?.sessionToken || 's_p2',
        name: data?.name || 'खेळाडू २',
        avatar: data?.avatar || '🦊'
      });
      wireRoomEvents(room);
      currentRoomCode = room.code;
      currentSessionToken = player.sessionToken;
      socket.join(room.code);
      if (ack) ack({ ok: true, roomCode: room.code, sessionToken: player.sessionToken, state: room.getPublicState(player.sessionToken) });
      broadcastRoomState(room);
    });

    socket.on('start_game', (ack) => {
      const room = hub.getRoom(currentRoomCode);
      if (room && room.startGame()) {
        if (ack) ack({ ok: true });
        broadcastRoomState(room);
      }
    });

    socket.on('select_word', (data) => {
      const room = hub.getRoom(currentRoomCode);
      if (room && room.selectWord(currentSessionToken, data?.wordId)) {
        io.to(room.code).emit('draw_clear');
        broadcastRoomState(room);
        io.to(room.code).emit('drawing_started', {
          drawerName: room.players.get(room.currentDrawerToken)?.name
        });
      }
    });

    socket.on('draw_stroke_start', (stroke) => {
      const room = hub.getRoom(currentRoomCode);
      if (room) {
        room.addStroke(stroke);
        socket.to(room.code).emit('draw_stroke_start', stroke);
      }
    });

    socket.on('draw_stroke_point', (data) => {
      const room = hub.getRoom(currentRoomCode);
      if (room) {
        room.appendStrokePoint(data.strokeId, data.point);
        socket.to(room.code).emit('draw_stroke_point', data);
      }
    });

    socket.on('draw_stroke_end', (data) => {
      socket.to(currentRoomCode).emit('draw_stroke_end', data);
    });

    socket.on('draw_undo', () => {
      const room = hub.getRoom(currentRoomCode);
      if (room) {
        const undone = room.undoStroke();
        if (undone) io.to(room.code).emit('draw_undo', { strokeId: undone.id });
      }
    });

    socket.on('draw_redo', () => {
      const room = hub.getRoom(currentRoomCode);
      if (room) {
        const redone = room.redoStroke();
        if (redone) io.to(room.code).emit('draw_redo', redone);
      }
    });

    socket.on('draw_clear', () => {
      const room = hub.getRoom(currentRoomCode);
      if (room) {
        room.clearCanvas();
        io.to(room.code).emit('draw_clear');
      }
    });

    socket.on('submit_guess', (data) => {
      const room = hub.getRoom(currentRoomCode);
      if (!room) return;
      const res = room.handleGuess(currentSessionToken, data?.text);
      if (res.type === 'correct') {
        socket.emit('guess_feedback', { status: 'correct', points: res.points, word: room.currentWord });
        io.to(room.code).emit('player_guessed_correct', {
          playerName: res.player.name,
          playerAvatar: res.player.avatar,
          points: res.points
        });
        broadcastRoomState(room);
      } else if (res.type === 'close') {
        socket.emit('guess_feedback', { status: 'close', text: data?.text });
      } else {
        io.to(room.code).emit('chat_message', { sender: res.player.name, text: res.text });
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        port,
        close: () => new Promise(r => server.close(r))
      });
    });
  });
}

test('Full Multiplayer Flow E2E: Room creation, 2 players, word pick, drawing sync, guessing, auto-clear', async () => {
  const testEnv = await setupTestServer();
  const url = `http://127.0.0.1:${testEnv.port}`;

  let client1, client2;
  try {
    // 1. Host creates room
    client1 = ioClient(url);
    const hostJoin = await new Promise((resolve) => {
      client1.emit('create_room', { name: 'सचिन', avatar: '👨‍🎨', sessionToken: 'tok_host' }, resolve);
    });
    assert.equal(hostJoin.ok, true);
    const roomCode = hostJoin.roomCode;
    assert.ok(roomCode);

    // 2. Player 2 joins room
    client2 = ioClient(url);
    const p2Join = await new Promise((resolve) => {
      client2.emit('join_room', { roomCode, name: 'रोहन', avatar: '🦊', sessionToken: 'tok_p2' }, resolve);
    });
    assert.equal(p2Join.ok, true);

    // 3. Start game
    let roomStateP1 = null;
    let roomStateP2 = null;
    client1.on('room_state', s => { roomStateP1 = s; });
    client2.on('room_state', s => { roomStateP2 = s; });

    const p1StatePromise = new Promise(resolve => {
      client1.on('room_state', s => { if (s.state === 'SELECTING_WORD') resolve(s); });
    });

    const started = await new Promise((resolve) => {
      client1.emit('start_game', resolve);
    });
    assert.equal(started.ok, true);
    await p1StatePromise;

    // 4. Drawer selects word
    const drawerToken = roomStateP1.currentDrawer.sessionToken;
    const drawerClient = drawerToken === 'tok_host' ? client1 : client2;
    const guesserClient = drawerToken === 'tok_host' ? client2 : client1;
    const guesserToken = drawerToken === 'tok_host' ? 'tok_p2' : 'tok_host';

    const clearPromise1 = new Promise(resolve => guesserClient.once('draw_clear', resolve));
    const wordChoices = roomStateP1.wordChoices || roomStateP2.wordChoices;
    assert.ok(wordChoices && wordChoices.length === 3);
    const chosenWord = wordChoices[0];

    drawerClient.emit('select_word', { wordId: chosenWord.id });
    await clearPromise1;
    assert.ok(true, 'Screen cleared when drawing starts');

    // 5. Drawer draws a stroke
    const strokePromise = new Promise(resolve => guesserClient.once('draw_stroke_start', resolve));
    const strokeData = {
      id: 'stroke_1',
      tool: 'brush',
      color: '#FF6B6B',
      sizeRatio: 0.02,
      points: [[0.2, 0.3]]
    };
    drawerClient.emit('draw_stroke_start', strokeData);
    const receivedStroke = await strokePromise;
    assert.equal(receivedStroke.id, 'stroke_1');
    assert.equal(receivedStroke.color, '#FF6B6B');

    // 6. Guesser submits incorrect guess
    const chatPromise = new Promise(resolve => drawerClient.once('chat_message', resolve));
    guesserClient.emit('submit_guess', { text: 'काहीतरी' });
    const chatMsg = await chatPromise;
    assert.equal(chatMsg.text, 'काहीतरी');

    // 7. Guesser submits correct guess & auto-clears on turn end
    const feedbackPromise = new Promise(resolve => guesserClient.once('guess_feedback', resolve));
    const clearPromise2 = new Promise(resolve => guesserClient.once('draw_clear', resolve));

    guesserClient.emit('submit_guess', { text: chosenWord.mr });
    const correctFeedback = await feedbackPromise;
    assert.equal(correctFeedback.status, 'correct');
    assert.ok(correctFeedback.points >= 300);

    // Wait for end of turn & auto-clear
    await clearPromise2;
    assert.ok(true, 'Drawing screen cleared automatically when turn ended!');

  } finally {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    await testEnv.close();
  }
});
