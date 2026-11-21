'use strict';

/**
 * 🎨 ओळखा पाहू! 👀 – Draw & Guess Battle
 * आंतरराष्ट्रीयीकरण आणि भाषा व्यवस्थापक (i18n)
 */

const I18N = {
  mr: {
    gameTitle: '🎨 ओळखा पाहू! 👀',
    gameSubtitle: '🎨 Draw & Guess Battle 👀',
    tagline: 'चित्रे काढा, शब्द ओळखा आणि मित्रांसोबत धम्माल मजा करा!',
    
    // Home Screen
    createRoom: 'खोली तयार करा 🚀',
    joinRoom: 'खोलीत सामील व्हा 🔑',
    roomCodePlaceholder: 'खोली कोड (उदा. MAZA)',
    yourNamePlaceholder: 'तुमचे नाव प्रविष्ट करा',
    chooseAvatar: 'तुमचा अवतार निवडा:',
    howToPlay: 'कसे खेळायचे? 📖',
    rulesTitle: 'खेळाचे नियम आणि माहिती',
    
    // Lobby
    waitingLobby: 'प्रतिक्षा कक्ष',
    roomCodeLabel: 'खोली कोड',
    copyCode: 'कोड कॉपी करा 📋',
    codeCopied: 'खोली कोड कॉपी झाला!',
    shareWhatsApp: 'व्हॉट्सअ‍ॅपवर पाठवा 💬',
    connectedPlayers: 'खेळाडू',
    hostBadge: 'होस्ट 👑',
    youBadge: '(तुम्ही)',
    readyStatus: 'तयार ✅',
    waitingStatus: 'प्रतिक्षा...',
    startGame: 'खेळ सुरू करा 🎮',
    waitingForHost: 'होस्ट खेळ सुरू करण्याची वाट पाहत आहे...',
    needMorePlayers: 'खेळ सुरू करण्यासाठी किमान २ खेळाडू हवेत',
    settingsTitle: 'खोलीच्या सेटिंग्ज ⚙️',
    roundDuration: 'वेळ प्रति फेरी:',
    totalRounds: 'एकूण फेऱ्या:',
    wordPack: 'शब्द प्रकार:',
    seconds: 'सेकंद',
    rounds: 'फेऱ्या',
    
    // In Game
    roundLabel: 'फेरी',
    secondsLeft: 'सेकंद',
    chooseAWord: 'चित्र काढण्यासाठी एक शब्द निवडा:',
    youAreDrawing: 'तुम्ही चित्र काढत आहात! 🎨',
    drawerIsDrawing: 'चित्र काढत आहेत...',
    wordToDraw: 'गुप्त शब्द:',
    lettersCount: 'अक्षरे',
    hintLabel: 'संकेत / Hint:',
    categoryLabel: 'प्रकार:',
    guessedCountLabel: 'खेळाडूंनी ओळखले',
    
    // Drawing Tools
    pencil: 'पेन्सिल',
    brush: 'ब्रश',
    eraser: 'खोडरबर',
    clearCanvas: 'कॅनव्हास साफ करा 🗑️',
    undo: 'मागे (Undo) ↩️',
    redo: 'पुढे (Redo) ↪️',
    brushSize: 'आकार',
    
    // Guessing & Chat
    guessPlaceholder: 'येथे तुमचा अंदाज टाईप करा...',
    submitGuess: 'ओळखा! 🎯',
    youGuessedCorrect: '🎉 अभिनंदन! तुम्ही अचूक उत्तर ओळखले!',
    playerGuessedCorrect: 'ने अचूक उत्तर ओळखले! 🏆',
    pointsEarned: 'गुण',
    veryClose: '🔥 खूप जवळ आहात! पुन्हा प्रयत्न करा!',
    alreadyGuessedChatNote: 'तुम्ही उत्तर ओळखले आहे. तुमचा मेसेज फक्त गुप्त ठेवला जाईल.',
    cannotGuessAsDrawer: 'तुम्ही चित्रकार आहात, अंदाज देऊ शकत नाही!',
    
    // Round End & Game Over
    roundEnded: 'फेरी संपली!',
    theWordWas: 'तो शब्द होता:',
    timeUp: 'वेळ संपली!',
    allPlayersGuessed: 'सर्व खेळाडूंनी ओळखले! 👏',
    gameOverTitle: 'खेळ संपला! महाविजेते 🏆',
    playAgain: 'पुन्हा खेळा 🔄',
    shareVictory: 'विजय शेअर करा 📤',
    firstPlace: 'प्रथम क्रमांक 🥇',
    secondPlace: 'द्वितीय क्रमांक 🥈',
    thirdPlace: 'तृतीय क्रमांक 🥉',
    finalScore: 'अंतिम गुण',

    // Rules
    rule1Title: '१. चित्र काढा 🖌️',
    rule1Desc: 'तुमच्या पाळीला दिलेल्या ३ शब्दांपैकी एक निवडा आणि बोटाने कॅनव्हासवर चित्र काढा.',
    rule2Title: '२. शब्द ओळखा 💡',
    rule2Desc: 'दुसऱ्या खेळाडूचे चित्र पाहून खालील बॉक्समध्ये अंदाज टाईप करा.',
    rule3Title: '३. वेगवान अंदाज, जास्त गुण ⏱️',
    rule3Desc: 'जेवढ्या लवकर ओळखाल तेवढे जास्त गुण मिळतील! चित्रकारालाही बोनस मिळतो.',
    rule4Title: '४. अक्षरे लिहू नका 🚫',
    rule4Desc: 'कॅनव्हासवर शब्द किंवा अक्षरे लिहू नका, फक्त चित्र काढून खेळाचा आनंद घ्या!',
    closeModal: 'समजले, चला खेळूया! 👍'
  },

  en: {
    gameTitle: '🎨 ओळखा पाहू! 👀',
    gameSubtitle: '🎨 Draw & Guess Battle 👀',
    tagline: 'Draw doodles, guess the secret word, and battle with friends!',
    
    // Home Screen
    createRoom: 'Create Room 🚀',
    joinRoom: 'Join Room 🔑',
    roomCodePlaceholder: 'Room Code (e.g. MAZA)',
    yourNamePlaceholder: 'Enter your name',
    chooseAvatar: 'Choose your avatar:',
    howToPlay: 'How to Play 📖',
    rulesTitle: 'Game Rules & Guide',
    
    // Lobby
    waitingLobby: 'Waiting Lobby',
    roomCodeLabel: 'Room Code',
    copyCode: 'Copy Code 📋',
    codeCopied: 'Room code copied to clipboard!',
    shareWhatsApp: 'Share on WhatsApp 💬',
    connectedPlayers: 'Players',
    hostBadge: 'Host 👑',
    youBadge: '(You)',
    readyStatus: 'Ready ✅',
    waitingStatus: 'Waiting...',
    startGame: 'Start Game 🎮',
    waitingForHost: 'Waiting for host to start the game...',
    needMorePlayers: 'Need at least 2 players to start',
    settingsTitle: 'Room Settings ⚙️',
    roundDuration: 'Turn Time:',
    totalRounds: 'Total Rounds:',
    wordPack: 'Word Pack:',
    seconds: 'sec',
    rounds: 'rounds',
    
    // In Game
    roundLabel: 'Round',
    secondsLeft: 'sec',
    chooseAWord: 'Choose a word to draw:',
    youAreDrawing: 'You are drawing! 🎨',
    drawerIsDrawing: 'is drawing...',
    wordToDraw: 'Secret Word:',
    lettersCount: 'letters',
    hintLabel: 'Hint:',
    categoryLabel: 'Category:',
    guessedCountLabel: 'Players Guessed',
    
    // Drawing Tools
    pencil: 'Pencil',
    brush: 'Brush',
    eraser: 'Eraser',
    clearCanvas: 'Clear Canvas 🗑️',
    undo: 'Undo ↩️',
    redo: 'Redo ↪️',
    brushSize: 'Size',
    
    // Guessing & Chat
    guessPlaceholder: 'Type your guess here...',
    submitGuess: 'Guess! 🎯',
    youGuessedCorrect: '🎉 Great job! You guessed the word!',
    playerGuessedCorrect: 'guessed the word! 🏆',
    pointsEarned: 'pts',
    veryClose: '🔥 You are very close! Try again!',
    alreadyGuessedChatNote: 'You guessed it! Your messages are visible only to winners.',
    cannotGuessAsDrawer: 'You are drawing, you cannot guess!',
    
    // Round End & Game Over
    roundEnded: 'Round Ended!',
    theWordWas: 'The word was:',
    timeUp: 'Time is up!',
    allPlayersGuessed: 'Everyone guessed! 👏',
    gameOverTitle: 'Game Over! Winners 🏆',
    playAgain: 'Play Again 🔄',
    shareVictory: 'Share Victory 📤',
    firstPlace: '1st Place 🥇',
    secondPlace: '2nd Place 🥈',
    thirdPlace: '3rd Place 🥉',
    finalScore: 'Final Score',

    // Rules
    rule1Title: '1. Draw the Word 🖌️',
    rule1Desc: 'When it is your turn, pick 1 of 3 words and draw it on the canvas using your finger.',
    rule2Title: '2. Guess Quickly 💡',
    rule2Desc: 'Watch the drawing unfold and type your guesses in the box at the bottom.',
    rule3Title: '3. Speed Equals Points ⏱️',
    rule3Desc: 'The faster you guess, the more points you score! The drawer also gets bonus points.',
    rule4Title: '4. No Spelling Letters 🚫',
    rule4Desc: 'Do not write out words or letters on the canvas. Keep it visual and fun!',
    closeModal: 'Got it, let’s play! 👍'
  }
};

class I18nManager {
  constructor() {
    this.lang = localStorage.getItem('olakha_pahu_lang') || 'mr'; // Marathi by default per requirement!
  }

  setLanguage(lang) {
    if (lang === 'mr' || lang === 'en') {
      this.lang = lang;
      localStorage.setItem('olakha_pahu_lang', lang);
      this.updateDOM();
    }
  }

  get(key) {
    return I18N[this.lang]?.[key] || I18N.mr[key] || key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && I18N[this.lang]?.[key]) {
        el.textContent = I18N[this.lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && I18N[this.lang]?.[key]) {
        el.setAttribute('placeholder', I18N[this.lang][key]);
      }
    });

    // Update active state on language buttons
    const btnMr = document.getElementById('lang-btn-mr');
    const btnEn = document.getElementById('lang-btn-en');
    if (btnMr) btnMr.classList.toggle('active', this.lang === 'mr');
    if (btnEn) btnEn.classList.toggle('active', this.lang === 'en');
  }
}

window.i18n = new I18nManager();
