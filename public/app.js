'use strict';

/**
 * 🎨 ओळखा पाहू! 👀 – Draw & Guess Battle
 * Main Frontend Application Controller
 */

(function () {
  // --- DOM Elements ---
  const screens = {
    home: document.getElementById('screen-home'),
    lobby: document.getElementById('screen-lobby'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover')
  };

  // Home Screen Elements
  const inputPlayerName = document.getElementById('input-player-name');
  const inputRoomCode = document.getElementById('input-room-code');
  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnJoinRoom = document.getElementById('btn-join-room');
  const btnOpenRules = document.getElementById('btn-open-rules');
  const avatarGrid = document.getElementById('avatar-grid');

  // Lobby Elements
  const lobbyRoomCode = document.getElementById('lobby-room-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
  const lobbyPlayerCount = document.getElementById('lobby-player-count');
  const lobbyPlayersList = document.getElementById('lobby-players-list');
  const lobbyHostSettings = document.getElementById('lobby-host-settings');
  const btnStartGame = document.getElementById('btn-start-game');
  const selectRoundTime = document.getElementById('select-round-time');
  const selectRounds = document.getElementById('select-rounds');
  const selectWordPack = document.getElementById('select-word-pack');

  // Game Screen Elements
  const gameRoundText = document.getElementById('game-round-text');
  const gameTimerPill = document.getElementById('game-timer-pill');
  const gameTimerVal = document.getElementById('game-timer-val');
  const gameWordDisplay = document.getElementById('game-word-display');
  const gameGuessedCount = document.getElementById('game-guessed-count');
  const canvasElement = document.getElementById('drawing-canvas');
  const drawerToolbar = document.getElementById('drawer-toolbar');
  const colorSwatchesContainer = document.getElementById('color-swatches');
  const chatMessagesList = document.getElementById('chat-messages');
  const inputGuess = document.getElementById('input-guess');
  const btnSubmitGuess = document.getElementById('btn-submit-guess');

  // Modals
  const modalRules = document.getElementById('modal-rules');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const modalWordPicker = document.getElementById('modal-word-picker');
  const wordChoicesList = document.getElementById('word-choices-list');

  // Game Over Elements
  const podiumContainer = document.getElementById('podium-container');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnShareGameOver = document.getElementById('btn-share-gameover');

  // Header Elements
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnLangMr = document.getElementById('lang-btn-mr');
  const btnLangEn = document.getElementById('lang-btn-en');

  // --- App State ---
  let socket = null;
  let canvasEngine = null;
  let sessionToken = localStorage.getItem('olakha_pahu_session') || '';
  let selectedAvatar = '👨‍🎨';
  let currentRoomCode = '';
  let isHost = false;
  let isDrawer = false;
  let hasGuessed = false;
  let lastDrawerToken = null;
  let lastRoundNumber = 0;

  const AVATARS = ['👨‍🎨', '🦊', '🦁', '🐯', '🐵', '🐼', '🦄', '🧙‍♂️', '🦚', '🐘', '👑', '😎'];
  const COLORS = [
    '#1E293B', '#FFFFFF', '#94A3B8', '#EF4444', '#F97316',
    '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#78350F'
  ];

  // --- Initialize App ---
  function init() {
    // 1. Language & i18n
    window.i18n.updateDOM();

    // 2. Sound state
    updateSoundBtn();

    // 3. Restore player info
    const savedName = localStorage.getItem('olakha_pahu_name');
    if (savedName && inputPlayerName) inputPlayerName.value = savedName;

    const savedAvatar = localStorage.getItem('olakha_pahu_avatar');
    if (savedAvatar && AVATARS.includes(savedAvatar)) selectedAvatar = savedAvatar;

    // Check URL query for room code (e.g. ?room=ABCD)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && inputRoomCode) {
      inputRoomCode.value = roomParam.toUpperCase().slice(0, 4);
    }

    // 4. Render Avatars
    renderAvatarGrid();

    // 5. Setup Drawing Canvas
    if (canvasElement) {
      canvasEngine = new window.DrawingCanvas(canvasElement);
      setupCanvasSocketSync();
    }

    // 6. Render Color Swatches
    renderColorSwatches();

    // 7. Connect Socket.IO
    connectSocket();

    // 8. Bind UI Events
    bindEvents();
  }

  // --- Socket.IO Setup ---
  function connectSocket() {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Connected to game server! Socket ID:', socket.id);
      // Automatically recover session & rejoin room if mobile connection dropped or app was switched
      if (currentRoomCode && sessionToken) {
        socket.emit('rejoin_room', { roomCode: currentRoomCode, sessionToken }, (res) => {
          if (res?.ok) {
            handleRoomState(res.state);
            socket.emit('request_canvas_sync');
          }
        });
      }
    });

    socket.on('room_state', (state) => {
      handleRoomState(state);
    });

    socket.on('timer_tick', (data) => {
      handleTimerTick(data.timeLeft);
    });

    socket.on('hint_unlocked', (data) => {
      showToast(window.i18n.get('hintLabel') + ' ' + (window.i18n.lang === 'mr' ? data.category : data.categoryEn));
      if (window.soundEngine) window.soundEngine.playPop();
    });

    socket.on('drawing_started', (data) => {
      closeWordPickerModal();
      if (canvasEngine) canvasEngine.clear(false);
      showToast(`🎨 ${data.drawerName} ${window.i18n.get('drawerIsDrawing')}`);
      if (window.soundEngine) window.soundEngine.playStart();
    });

    socket.on('guess_feedback', (feedback) => {
      if (feedback.status === 'correct') {
        hasGuessed = true;
        if (inputGuess) {
          inputGuess.value = '';
          inputGuess.disabled = true;
          inputGuess.placeholder = window.i18n.get('youGuessedCorrect');
        }
        showToast(window.i18n.get('youGuessedCorrect') + ` (+${feedback.points})`);
        if (window.soundEngine) window.soundEngine.playCorrect();
      } else if (feedback.status === 'close') {
        showToast(window.i18n.get('veryClose'));
        appendChatMessage({
          sender: 'संकेत / Hint',
          text: `"${feedback.text}" ${window.i18n.get('veryClose')}`,
          type: 'close-hint'
        });
        if (window.soundEngine) window.soundEngine.playClose();
      }
    });

    socket.on('player_guessed_correct', (data) => {
      appendChatMessage({
        sender: 'सिस्टीम',
        text: `🎉 ${data.playerAvatar} ${data.playerName} ${window.i18n.get('playerGuessedCorrect')} (+${data.points})`,
        type: 'correct'
      });
      if (window.soundEngine) window.soundEngine.playPop();
    });

    socket.on('chat_message', (msg) => {
      appendChatMessage({
        sender: msg.sender,
        avatar: msg.avatar,
        text: msg.text,
        type: msg.isSpectator ? 'close-hint' : 'normal'
      });
    });

    socket.on('player_joined', (p) => {
      showToast(`${p.avatar} ${p.name} सामील झाले!`);
      if (window.soundEngine) window.soundEngine.playPop();
    });

    socket.on('player_left', (p) => {
      showToast(`${p.name} बाहेर पडले.`);
    });

    socket.on('turn_ended', (data) => {
      // Turn ended: automatically clear canvas screen for all players
      if (canvasEngine) canvasEngine.clear(false);
      if (data.word) {
        showToast(`${window.i18n.get('theWordWas')} ${data.word.mr} (${data.word.en})`);
      }
    });

    socket.on('game_over', (data) => {
      if (canvasEngine) canvasEngine.clear(false);
      handleGameOver(data.leaderboard);
    });

    // Remote Canvas Drawing Listeners
    socket.on('draw_stroke_start', (stroke) => {
      if (canvasEngine) canvasEngine.renderRemoteStrokeStart(stroke);
    });

    socket.on('draw_stroke_point', (data) => {
      if (canvasEngine) canvasEngine.renderRemoteStrokePoint(data);
    });

    socket.on('draw_stroke_end', (data) => {
      if (canvasEngine) canvasEngine.renderRemoteStrokeEnd(data);
    });

    socket.on('draw_undo', (data) => {
      if (canvasEngine) canvasEngine.applyRemoteUndo(data.strokeId);
    });

    socket.on('draw_redo', (data) => {
      if (canvasEngine) canvasEngine.applyRemoteRedo(data);
    });

    socket.on('draw_clear', () => {
      if (canvasEngine) canvasEngine.clear(false);
    });

    socket.on('canvas_sync', (data) => {
      if (canvasEngine && data.strokes) canvasEngine.syncAllStrokes(data.strokes);
    });
  }

  // --- Synchronize local Canvas with Socket.IO ---
  function setupCanvasSocketSync() {
    canvasEngine.onStrokeStart = (stroke) => {
      socket.emit('draw_stroke_start', stroke);
    };

    canvasEngine.onStrokePoint = (strokeId, point) => {
      socket.emit('draw_stroke_point', { strokeId, point });
    };

    canvasEngine.onStrokeEnd = (strokeId) => {
      socket.emit('draw_stroke_end', { strokeId });
    };

    canvasEngine.onUndo = () => {
      socket.emit('draw_undo');
    };

    canvasEngine.onRedo = () => {
      socket.emit('draw_redo');
    };

    canvasEngine.onClear = () => {
      socket.emit('draw_clear');
    };
  }

  // --- Screen Switching ---
  function showScreen(name) {
    for (const key of Object.keys(screens)) {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === name);
      }
    }
    // Resize canvas if switching to game
    if (name === 'game' && canvasEngine) {
      setTimeout(() => canvasEngine.resize(), 100);
    }
  }

  // --- Handle Room State Updates ---
  function handleRoomState(state) {
    currentRoomCode = state.code;
    isDrawer = state.isDrawer;
    hasGuessed = state.hasGuessed;

    // Check host status
    const me = state.players.find(p => p.sessionToken === sessionToken);
    if (me) isHost = me.isHost;

    // Automatically clear canvas if drawer changed or entering word selection
    const activeDrawerToken = state.currentDrawer?.sessionToken;
    if (state.state === 'SELECTING_WORD' || (activeDrawerToken && activeDrawerToken !== lastDrawerToken) || (state.round && state.round !== lastRoundNumber)) {
      if (canvasEngine && state.state !== 'ROUND_END') {
        canvasEngine.clear(false);
      }
    }
    lastDrawerToken = activeDrawerToken;
    lastRoundNumber = state.round;

    if (state.state === 'LOBBY') {
      if (canvasEngine) canvasEngine.clear(false);
      showScreen('lobby');
      renderLobby(state);
    } else if (state.state === 'SELECTING_WORD' || state.state === 'DRAWING' || state.state === 'ROUND_END') {
      showScreen('game');
      renderGameScreen(state);
    } else if (state.state === 'GAME_OVER') {
      if (canvasEngine) canvasEngine.clear(false);
      showScreen('gameover');
    }
  }

  // --- Lobby Rendering ---
  function renderLobby(state) {
    if (lobbyRoomCode) lobbyRoomCode.textContent = state.code;

    const connected = state.players.filter(p => p.connected);
    if (lobbyPlayerCount) {
      lobbyPlayerCount.textContent = `${connected.length}/8`;
    }

    if (lobbyPlayersList) {
      lobbyPlayersList.innerHTML = connected.map(p => `
        <div class="player-card">
          <div class="player-avatar">${p.avatar}</div>
          <div class="player-info">
            <div class="player-name-row">
              <span>${p.name}</span>
              ${p.isHost ? `<span class="crown-icon">👑</span>` : ''}
              ${p.sessionToken === sessionToken ? `<span class="you-tag">${window.i18n.get('youBadge')}</span>` : ''}
            </div>
            <div class="player-status-tag">${window.i18n.get('readyStatus')}</div>
          </div>
        </div>
      `).join('');
    }

    // Host controls & Settings synchronization
    if (selectRoundTime) {
      selectRoundTime.value = String(state.roundTime || 80);
      selectRoundTime.disabled = !isHost;
    }
    if (selectRounds) {
      selectRounds.value = String(state.maxRounds || 3);
      selectRounds.disabled = !isHost;
    }
    if (selectWordPack) {
      selectWordPack.value = state.wordPack || 'all';
      selectWordPack.disabled = !isHost;
    }

    if (btnStartGame) {
      if (isHost) {
        btnStartGame.style.display = 'inline-flex';
        btnStartGame.disabled = connected.length < 2;
        btnStartGame.textContent = connected.length < 2
          ? window.i18n.get('needMorePlayers')
          : window.i18n.get('startGame');
      } else {
        btnStartGame.style.display = 'none';
      }
    }
  }

  // --- Game Arena Rendering ---
  function renderGameScreen(state) {
    // 1. Round indicator
    if (gameRoundText) {
      gameRoundText.textContent = `${window.i18n.get('roundLabel')} ${state.round}/${state.maxRounds}`;
    }

    // 2. Timer
    handleTimerTick(state.timeLeft);

    // 3. Guessed count
    const guessers = state.players.filter(p => !p.isCurrentDrawer);
    const guessedCount = guessers.filter(p => p.hasGuessed).length;
    if (gameGuessedCount) {
      gameGuessedCount.textContent = `🎯 ${guessedCount}/${guessers.length} ${window.i18n.get('guessedCountLabel')}`;
    }

    // 4. Word display
    if (gameWordDisplay && state.wordInfo) {
      if (state.isDrawer) {
        // Drawer sees full secret word
        gameWordDisplay.innerHTML = `
          <div class="masked-word" style="letter-spacing: 1px;">🎨 ${state.wordInfo.mr} <span style="font-size:0.8em; opacity:0.8;">(${state.wordInfo.en})</span></div>
          <div class="word-hint-badge">${window.i18n.get('youAreDrawing')}</div>
        `;
      } else {
        // Guessers see masked word
        const masked = window.i18n.lang === 'en' ? state.wordInfo.maskedEn : state.wordInfo.maskedMr;
        const category = window.i18n.lang === 'en' ? state.wordInfo.categoryEn : state.wordInfo.category;
        gameWordDisplay.innerHTML = `
          <div class="masked-word">${masked}</div>
          <div class="word-hint-badge">${category ? `${window.i18n.get('categoryLabel')} ${category} • ` : ''}${state.wordInfo.letterCount} ${window.i18n.get('lettersCount')}</div>
        `;
      }
    }

    // 5. Drawer Mode vs Guesser Mode
    if (canvasEngine) {
      canvasEngine.setInteractive(state.isDrawer && state.state === 'DRAWING');
    }

    if (drawerToolbar) {
      drawerToolbar.classList.toggle('active', state.isDrawer && state.state === 'DRAWING');
    }

    // Word selection modal for drawer
    if (state.isDrawer && state.state === 'SELECTING_WORD' && state.wordChoices) {
      openWordPickerModal(state.wordChoices);
    } else {
      closeWordPickerModal();
    }

    // Guess input state
    if (inputGuess) {
      if (state.isDrawer) {
        inputGuess.disabled = true;
        inputGuess.placeholder = window.i18n.get('cannotGuessAsDrawer');
      } else if (hasGuessed) {
        inputGuess.disabled = true;
        inputGuess.placeholder = window.i18n.get('youGuessedCorrect');
      } else {
        inputGuess.disabled = false;
        inputGuess.placeholder = window.i18n.get('guessPlaceholder');
      }
    }
    if (btnSubmitGuess) {
      btnSubmitGuess.disabled = Boolean(state.isDrawer || hasGuessed || state.state !== 'DRAWING');
    }
  }

  // --- Timer Tick ---
  function handleTimerTick(timeLeft) {
    if (gameTimerVal) gameTimerVal.textContent = timeLeft;
    if (gameTimerPill) {
      gameTimerPill.classList.toggle('urgent', timeLeft <= 15);
    }
    if (timeLeft <= 10 && timeLeft > 0 && window.soundEngine) {
      window.soundEngine.playTick();
    }
  }

  // --- Word Selection Modal ---
  function openWordPickerModal(choices) {
    if (!modalWordPicker || !wordChoicesList) return;
    wordChoicesList.innerHTML = choices.map(w => `
      <button class="word-choice-btn" data-id="${w.id}">
        <span class="word-choice-main">${w.mr}</span>
        <span class="word-choice-sub">${w.en} (${w.category})</span>
      </button>
    `).join('');

    modalWordPicker.classList.add('active');

    wordChoicesList.querySelectorAll('.word-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wordId = btn.getAttribute('data-id');
        socket.emit('select_word', { wordId });
        closeWordPickerModal();
      });
    });
  }

  function closeWordPickerModal() {
    if (modalWordPicker) modalWordPicker.classList.remove('active');
  }

  // --- Game Over / Podium ---
  function handleGameOver(leaderboard) {
    showScreen('gameover');
    if (window.soundEngine) window.soundEngine.playVictory();

    if (!podiumContainer) return;
    const p1 = leaderboard[0] || { name: '-', avatar: '👑', score: 0 };
    const p2 = leaderboard[1] || { name: '-', avatar: '🥈', score: 0 };
    const p3 = leaderboard[2] || { name: '-', avatar: '🥉', score: 0 };

    podiumContainer.innerHTML = `
      <!-- 2nd Place -->
      <div class="podium-place">
        <div class="podium-avatar">${p2.avatar}</div>
        <div class="podium-player-name">${p2.name}</div>
        <div class="podium-block rank-2">
          <span>2</span>
          <span class="podium-player-score">${p2.score} ${window.i18n.get('pointsEarned')}</span>
        </div>
      </div>
      <!-- 1st Place -->
      <div class="podium-place">
        <div class="podium-avatar">👑 ${p1.avatar}</div>
        <div class="podium-player-name">${p1.name}</div>
        <div class="podium-block rank-1">
          <span>1</span>
          <span class="podium-player-score">${p1.score} ${window.i18n.get('pointsEarned')}</span>
        </div>
      </div>
      <!-- 3rd Place -->
      <div class="podium-place">
        <div class="podium-avatar">${p3.avatar}</div>
        <div class="podium-player-name">${p3.name}</div>
        <div class="podium-block rank-3">
          <span>3</span>
          <span class="podium-player-score">${p3.score} ${window.i18n.get('pointsEarned')}</span>
        </div>
      </div>
    `;

    if (btnPlayAgain) {
      btnPlayAgain.style.display = isHost ? 'inline-flex' : 'none';
    }
  }

  // --- Render Components ---
  function renderAvatarGrid() {
    if (!avatarGrid) return;
    avatarGrid.innerHTML = AVATARS.map(av => `
      <div class="avatar-chip ${av === selectedAvatar ? 'selected' : ''}" data-avatar="${av}">
        ${av}
      </div>
    `).join('');

    avatarGrid.querySelectorAll('.avatar-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedAvatar = chip.getAttribute('data-avatar');
        localStorage.setItem('olakha_pahu_avatar', selectedAvatar);
        avatarGrid.querySelectorAll('.avatar-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        if (window.soundEngine) window.soundEngine.playPop();
      });
    });
  }

  function renderColorSwatches() {
    if (!colorSwatchesContainer) return;
    colorSwatchesContainer.innerHTML = COLORS.map(c => `
      <div class="color-dot ${c === '#1E293B' ? 'selected' : ''}" style="background-color: ${c};" data-color="${c}"></div>
    `).join('');

    colorSwatchesContainer.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const color = dot.getAttribute('data-color');
        if (canvasEngine) canvasEngine.setColor(color);
        colorSwatchesContainer.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        if (window.soundEngine) window.soundEngine.playPop();
      });
    });
  }

  // --- Chat Helper ---
  function appendChatMessage(msg) {
    if (!chatMessagesList) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.type || 'normal'}`;

    if (msg.type === 'system' || msg.type === 'correct' || msg.type === 'close-hint') {
      bubble.textContent = msg.text;
    } else {
      bubble.innerHTML = `<strong>${msg.avatar ? msg.avatar + ' ' : ''}${msg.sender}:</strong> ${msg.text}`;
    }

    chatMessagesList.appendChild(bubble);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
  }

  // --- Toast Notification ---
  function showToast(text) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- Sound Button Update ---
  function updateSoundBtn() {
    if (btnToggleSound) {
      const enabled = window.soundEngine ? window.soundEngine.enabled : true;
      btnToggleSound.textContent = enabled ? '🔊' : '🔇';
    }
  }

  // --- Bind All Events ---
  function bindEvents() {
    // Keyboard Enter keys on inputs
    if (inputPlayerName) {
      inputPlayerName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (inputRoomCode?.value.trim()) {
            btnJoinRoom?.click();
          } else {
            btnCreateRoom?.click();
          }
        }
      });
    }

    if (inputRoomCode) {
      inputRoomCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnJoinRoom?.click();
        }
      });
    }

    // 1. Create Room
    if (btnCreateRoom) {
      btnCreateRoom.addEventListener('click', () => {
        const name = (inputPlayerName?.value || 'खेळाडू').trim();
        localStorage.setItem('olakha_pahu_name', name);
        if (window.soundEngine) window.soundEngine.playPop();

        socket.emit('create_room', {
          name,
          avatar: selectedAvatar,
          sessionToken
        }, (res) => {
          if (res?.ok) {
            sessionToken = res.sessionToken;
            localStorage.setItem('olakha_pahu_session', sessionToken);
            handleRoomState(res.state);
          } else {
            showToast(res?.error || 'त्रुटी आली');
          }
        });
      });
    }

    // 2. Join Room
    if (btnJoinRoom) {
      btnJoinRoom.addEventListener('click', () => {
        const code = (inputRoomCode?.value || '').trim().toUpperCase();
        if (!code || code.length < 3) {
          showToast('कृपया वैध खोली कोड प्रविष्ट करा!');
          return;
        }

        const name = (inputPlayerName?.value || 'खेळाडू').trim();
        localStorage.setItem('olakha_pahu_name', name);
        if (window.soundEngine) window.soundEngine.playPop();

        socket.emit('join_room', {
          roomCode: code,
          name,
          avatar: selectedAvatar,
          sessionToken
        }, (res) => {
          if (res?.ok) {
            sessionToken = res.sessionToken;
            localStorage.setItem('olakha_pahu_session', sessionToken);
            handleRoomState(res.state);
          } else {
            showToast(res?.error || 'खोली सापडली नाही');
          }
        });
      });
    }

    // 3. Copy Code
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (!currentRoomCode) return;
        navigator.clipboard.writeText(currentRoomCode).then(() => {
          showToast(window.i18n.get('codeCopied'));
          if (window.soundEngine) window.soundEngine.playPop();
        }).catch(() => {
          showToast(`खोली कोड: ${currentRoomCode}`);
        });
      });
    }

    // 4. WhatsApp Share
    if (btnShareWhatsapp) {
      btnShareWhatsapp.addEventListener('click', () => {
        if (!currentRoomCode) return;
        const origin = window.location.origin;
        const shareLink = `${origin}/?room=${currentRoomCode}`;
        const shareText = `🎨 ओळखा पाहू! 👀 (Draw & Guess Battle) खेळायला या!\n\nखोली कोड: ${currentRoomCode}\nसामील होण्यासाठी येथे क्लिक करा: ${shareLink}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      });
    }

    // 5. Host Start Game
    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        if (!isHost) return;
        if (window.soundEngine) window.soundEngine.playPop();
        socket.emit('start_game', (res) => {
          if (!res?.ok && res?.error) {
            showToast(res.error);
          }
        });
      });
    }

    // 6. Host Settings Change
    const handleSettingsChange = () => {
      if (!isHost) return;
      socket.emit('update_settings', {
        roundTime: selectRoundTime?.value || 80,
        maxRounds: selectRounds?.value || 3,
        wordPack: selectWordPack?.value || 'all'
      });
    };
    if (selectRoundTime) selectRoundTime.addEventListener('change', handleSettingsChange);
    if (selectRounds) selectRounds.addEventListener('change', handleSettingsChange);
    if (selectWordPack) selectWordPack.addEventListener('change', handleSettingsChange);

    // 7. Drawer Tools & Actions
    document.querySelectorAll('.tool-chip[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.getAttribute('data-tool');
        if (canvasEngine) canvasEngine.setTool(tool);
        document.querySelectorAll('.tool-chip[data-tool]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (window.soundEngine) window.soundEngine.playPop();
      });
    });

    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        if (canvasEngine) canvasEngine.undo();
        if (window.soundEngine) window.soundEngine.playPop();
      });
    }

    const btnRedo = document.getElementById('btn-redo');
    if (btnRedo) {
      btnRedo.addEventListener('click', () => {
        if (canvasEngine) canvasEngine.redo();
        if (window.soundEngine) window.soundEngine.playPop();
      });
    }

    const btnClearCanvas = document.getElementById('btn-clear-canvas');
    if (btnClearCanvas) {
      btnClearCanvas.addEventListener('click', () => {
        if (canvasEngine) canvasEngine.clear();
        if (window.soundEngine) window.soundEngine.playPop();
      });
    }

    // Brush Sizes
    document.querySelectorAll('.tool-chip[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.getAttribute('data-size'), 10);
        if (canvasEngine) canvasEngine.setSize(size);
        document.querySelectorAll('.tool-chip[data-size]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (window.soundEngine) window.soundEngine.playPop();
      });
    });

    // 8. Guess Submission
    const handleGuessSubmit = () => {
      if (!inputGuess) return;
      const text = inputGuess.value.trim();
      if (!text) return;
      socket.emit('submit_guess', { text });
      inputGuess.value = '';
    };

    if (btnSubmitGuess) {
      btnSubmitGuess.addEventListener('click', handleGuessSubmit);
    }

    if (inputGuess) {
      inputGuess.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleGuessSubmit();
        }
      });
    }

    // 9. Rules Modal
    if (btnOpenRules && modalRules) {
      btnOpenRules.addEventListener('click', () => {
        modalRules.classList.add('active');
        if (window.soundEngine) window.soundEngine.playPop();
      });
    }
    if (btnCloseRules && modalRules) {
      btnCloseRules.addEventListener('click', () => {
        modalRules.classList.remove('active');
      });
    }

    // 10. Play Again (Host)
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        if (!isHost) return;
        socket.emit('play_again');
      });
    }

    // 11. Share Game Over Victory
    if (btnShareGameOver) {
      btnShareGameOver.addEventListener('click', () => {
        const origin = window.location.origin;
        const text = `🎨 ओळखा पाहू! 👀 (Draw & Guess Battle) खेळून आम्ही धम्माल मजा केली! तुम्हीही खेळा: ${origin}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    // 12. Audio Mute Toggle
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        if (window.soundEngine) {
          window.soundEngine.toggle();
          updateSoundBtn();
        }
      });
    }

    // 13. Language Selector
    if (btnLangMr) {
      btnLangMr.addEventListener('click', () => {
        window.i18n.setLanguage('mr');
      });
    }
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => {
        window.i18n.setLanguage('en');
      });
    }
  }

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();
