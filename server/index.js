'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { GameHub } = require('./game');
const wordsLib = require('./words');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with mobile-optimized settings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e6 // 1MB for fast stroke transfers
});

const hub = new GameHub();

// Clean up inactive rooms periodically
setInterval(() => hub.cleanInactiveRooms(), 60000);

// Security & Caching middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Room info API endpoint
app.get('/api/room/:code', (req, res) => {
  const room = hub.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ exists: false });
  }
  return res.json({
    exists: true,
    code: room.code,
    state: room.state,
    playerCount: room.getConnectedPlayers().length,
    canJoin: room.state === 'LOBBY' || room.state === 'DRAWING'
  });
});

// Serve static assets from public/
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  etag: true
}));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// --- Helper to broadcast room state to all sockets in room ---
function broadcastRoomState(room) {
  for (const [socketId, sessionToken] of room.socketToSession.entries()) {
    const clientState = room.getPublicState(sessionToken);
    io.to(socketId).emit('room_state', clientState);
  }
}

// --- Wire Room callbacks to Socket.IO events ---
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
    // Automatically clear drawing screen when turn ends!
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
    // Sort winners by score descending
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

// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentSessionToken = null;

  // 1. Create Room
  socket.on('create_room', (data, ack) => {
    try {
      const { name, avatar, options } = data || {};
      const sessionToken = data?.sessionToken || 's_' + Math.random().toString(36).slice(2, 10);

      const room = hub.createRoom({
        socketId: socket.id,
        sessionToken,
        name: (name || 'खेळाडू').trim(),
        avatar: avatar || '👨‍🎨'
      }, options);

      wireRoomEvents(room);

      currentRoomCode = room.code;
      currentSessionToken = sessionToken;
      socket.join(room.code);

      const state = room.getPublicState(sessionToken);

      if (typeof ack === 'function') {
        ack({ ok: true, roomCode: room.code, sessionToken, state });
      }
      broadcastRoomState(room);
    } catch (err) {
      console.error('Error creating room:', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'खोली तयार करता आली नाही' });
    }
  });

  // 2. Join Room
  socket.on('join_room', (data, ack) => {
    try {
      const { roomCode, name, avatar, sessionToken } = data || {};
      const room = hub.getRoom(roomCode);

      if (!room) {
        if (typeof ack === 'function') ack({ ok: false, error: 'खोली सापडली नाही / Room not found' });
        return;
      }

      const player = room.addPlayer({
        socketId: socket.id,
        sessionToken: sessionToken || 's_' + Math.random().toString(36).slice(2, 10),
        name: (name || 'खेळाडू').trim(),
        avatar: avatar || '🦊'
      });

      wireRoomEvents(room);

      currentRoomCode = room.code;
      currentSessionToken = player.sessionToken;
      socket.join(room.code);

      const state = room.getPublicState(player.sessionToken);

      if (typeof ack === 'function') {
        ack({ ok: true, roomCode: room.code, sessionToken: player.sessionToken, state });
      }

      // Notify others in room
      socket.to(room.code).emit('player_joined', {
        name: player.name,
        avatar: player.avatar
      });

      broadcastRoomState(room);

      // If game is in progress, send canvas strokes
      if (room.state === 'DRAWING' && room.strokes.length > 0) {
        socket.emit('canvas_sync', { strokes: room.strokes });
      }
    } catch (err) {
      console.error('Error joining room:', err);
      if (typeof ack === 'function') ack({ ok: false, error: 'खोलीत सामील होता आले नाही' });
    }
  });

  // 2b. Rejoin Room (for mobile app switching e.g. WhatsApp share return)
  socket.on('rejoin_room', (data, ack) => {
    try {
      const { roomCode, sessionToken } = data || {};
      const room = hub.getRoom(roomCode);
      if (!room) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      const player = room.players.get(sessionToken);
      if (!player) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      player.connected = true;
      player.socketId = socket.id;
      room.socketToSession.set(socket.id, sessionToken);
      currentRoomCode = room.code;
      currentSessionToken = sessionToken;
      socket.join(room.code);

      const state = room.getPublicState(sessionToken);
      if (typeof ack === 'function') {
        ack({ ok: true, state });
      }
      broadcastRoomState(room);

      if (room.state === 'DRAWING' && room.strokes.length > 0) {
        socket.emit('canvas_sync', { strokes: room.strokes });
      }
    } catch (err) {
      console.error('Error rejoining room:', err);
      if (typeof ack === 'function') ack({ ok: false });
    }
  });

  // Helper to reliably resolve player even across network jitters
  function resolvePlayer() {
    const room = hub.getRoom(currentRoomCode);
    if (!room) return null;
    const token = currentSessionToken || room.socketToSession.get(socket.id);
    return { room, sessionToken: token };
  }

  // 3. Start Game (Host only)
  socket.on('start_game', (ack) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room) return;
    const room = ctx.room;

    const player = room.getPlayerBySocket(socket.id);
    if (!player || !player.isHost) {
      if (typeof ack === 'function') ack({ ok: false, error: 'फक्त होस्ट खेळ सुरू करू शकतो' });
      return;
    }

    if (!room.canStart()) {
      if (typeof ack === 'function') ack({ ok: false, error: 'किमान २ खेळाडू आवश्यक आहेत' });
      return;
    }

    const started = room.startGame();
    if (started) {
      if (typeof ack === 'function') ack({ ok: true });
      broadcastRoomState(room);
    }
  });

  // 4. Drawer Selects Word
  socket.on('select_word', (data) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room) return;
    const room = ctx.room;

    const success = room.selectWord(ctx.sessionToken, data?.wordId);
    if (success) {
      io.to(room.code).emit('draw_clear');
      broadcastRoomState(room);
      io.to(room.code).emit('drawing_started', {
        drawerName: room.players.get(room.currentDrawerToken)?.name
      });
    }
  });

  // 5. Drawing Events (Optimized Socket.IO broadcasting with normalized coordinates)
  socket.on('draw_stroke_start', (stroke) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    ctx.room.addStroke(stroke);
    socket.to(ctx.room.code).emit('draw_stroke_start', stroke);
  });

  socket.on('draw_stroke_point', (data) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    const { strokeId, point } = data || {};
    if (strokeId && point) {
      ctx.room.appendStrokePoint(strokeId, point);
      socket.to(ctx.room.code).emit('draw_stroke_point', { strokeId, point });
    }
  });

  socket.on('draw_stroke_end', (data) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    socket.to(ctx.room.code).emit('draw_stroke_end', data);
  });

  socket.on('draw_undo', () => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    const undone = ctx.room.undoStroke();
    if (undone) {
      io.to(ctx.room.code).emit('draw_undo', { strokeId: undone.id });
    }
  });

  socket.on('draw_redo', () => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    const redone = ctx.room.redoStroke();
    if (redone) {
      io.to(ctx.room.code).emit('draw_redo', redone);
    }
  });

  socket.on('draw_clear', () => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room || ctx.room.state !== 'DRAWING' || ctx.room.currentDrawerToken !== ctx.sessionToken) return;

    ctx.room.clearCanvas();
    io.to(ctx.room.code).emit('draw_clear');
  });

  socket.on('request_canvas_sync', () => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room) return;
    if (ctx.room.strokes.length > 0) {
      socket.emit('canvas_sync', { strokes: ctx.room.strokes });
    }
  });

  // 6. Submitting a Guess or Chat message
  socket.on('submit_guess', (data) => {
    const ctx = resolvePlayer();
    if (!ctx || !ctx.room) return;
    const room = ctx.room;

    const result = room.handleGuess(ctx.sessionToken, data?.text);

    if (result.type === 'correct') {
      // 1. Notify guesser with celebration & earned points
      socket.emit('guess_feedback', {
        status: 'correct',
        points: result.points,
        word: room.currentWord
      });

      // 2. Broadcast celebration notification to whole room
      io.to(room.code).emit('player_guessed_correct', {
        playerName: result.player.name,
        playerAvatar: result.player.avatar,
        points: result.points,
        guessedCount: result.guessedCount,
        totalGuessers: result.totalGuessers
      });

      // 3. Update room state
      broadcastRoomState(room);
    } else if (result.type === 'close') {
      // Private feedback to guesser only!
      socket.emit('guess_feedback', {
        status: 'close',
        text: data.text
      });
    } else if (result.type === 'chat') {
      // Public chat message
      io.to(room.code).emit('chat_message', {
        sender: result.player.name,
        avatar: result.player.avatar,
        text: result.text,
        isGuessed: result.player.hasGuessed
      });
    } else if (result.type === 'guessed_chat') {
      // Chat visible only to drawer and players who already guessed
      for (const p of room.getAllPlayers()) {
        if ((p.hasGuessed || p.sessionToken === room.currentDrawerToken) && p.socketId) {
          io.to(p.socketId).emit('chat_message', {
            sender: result.player.name,
            avatar: result.player.avatar,
            text: result.text,
            isSpectator: true
          });
        }
      }
    }
  });

  // 7. Update Room Settings (Host only)
  socket.on('update_settings', (settings) => {
    if (!currentRoomCode) return;
    const room = hub.getRoom(currentRoomCode);
    if (!room || room.state !== 'LOBBY') return;

    const player = room.getPlayerBySocket(socket.id);
    if (!player || !player.isHost) return;

    if (settings.roundTime) room.roundTime = Math.min(120, Math.max(30, parseInt(settings.roundTime, 10)));
    if (settings.maxRounds) room.maxRounds = Math.min(10, Math.max(1, parseInt(settings.maxRounds, 10)));
    if (settings.wordPack) room.wordPack = settings.wordPack;

    broadcastRoomState(room);
  });

  // 8. Play Again (Host resets room to lobby)
  socket.on('play_again', () => {
    if (!currentRoomCode) return;
    const room = hub.getRoom(currentRoomCode);
    if (!room) return;

    const player = room.getPlayerBySocket(socket.id);
    if (!player || !player.isHost) return;

    room.resetToLobby();
  });

  // 9. Disconnect handling
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = hub.getRoom(currentRoomCode);
    if (!room) return;

    const player = room.removePlayer(socket.id);
    if (player) {
      io.to(room.code).emit('player_left', {
        name: player.name,
        isHost: player.isHost
      });
      broadcastRoomState(room);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨 ओळखा पाहू! 👀 – Draw & Guess Battle running at http://localhost:${PORT}`);
});
