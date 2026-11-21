'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const wordsLib = require('../words');
const { Room, GameHub } = require('../game');

test('words library has rich word bank and correct properties', () => {
  assert.ok(wordsLib.WORDS.length >= 40, 'Should have at least 40 words');
  for (const w of wordsLib.WORDS) {
    assert.ok(w.id, 'Word must have id');
    assert.ok(w.mr, 'Word must have Marathi text');
    assert.ok(w.en, 'Word must have English text');
    assert.ok(w.category, 'Word must have category');
    assert.ok(w.hint, 'Word must have Marathi hint');
    assert.ok(Array.isArray(w.aliases), 'Word must have aliases array');
  }
});

test('wordsLib.isMatch matches Marathi, English, and transliterations', () => {
  const modak = wordsLib.WORDS.find(w => w.mr === 'मोदक');
  assert.ok(modak, 'Modak word should exist');

  assert.equal(wordsLib.isMatch('मोदक', modak), true);
  assert.equal(wordsLib.isMatch('  मोदक!  ', modak), true);
  assert.equal(wordsLib.isMatch('Modak', modak), true);
  assert.equal(wordsLib.isMatch('modak', modak), true);
  assert.equal(wordsLib.isMatch('MODAK', modak), true);
  assert.equal(wordsLib.isMatch('pizza', modak), false);
});

test('wordsLib.isClose detects close typos', () => {
  const vadapav = wordsLib.WORDS.find(w => w.mr === 'वडापाव');
  assert.ok(vadapav, 'Vadapav word should exist');

  assert.equal(wordsLib.isClose('vadapv', vadapav), true);
  assert.equal(wordsLib.isClose('wadapav', vadapav), false); // alias exact match, not close
  assert.equal(wordsLib.isClose('xyzabc', vadapav), false);
});

test('wordsLib.maskWord masks characters and preserves syllables', () => {
  const tea = wordsLib.WORDS.find(w => w.mr === 'चहा');
  const masked0 = wordsLib.maskWord(tea, 0, 'mr');
  assert.equal(masked0.masked, '_ _');
  assert.equal(masked0.letterCount, 2);

  const maskedHalf = wordsLib.maskWord(tea, 0.5, 'mr');
  assert.ok(maskedHalf.masked.includes('_'));
  assert.ok(maskedHalf.masked.includes('च') || maskedHalf.masked.includes('हा'));
});

test('GameHub creates and retrieves rooms', () => {
  const hub = new GameHub();
  const room = hub.createRoom({ socketId: 'sock_1', name: 'प्रथमेश', avatar: '👨‍🎨' });
  assert.ok(room.code);
  assert.equal(room.code.length, 4);

  const found = hub.getRoom(room.code);
  assert.equal(found, room);
  assert.equal(found.players.size, 1);
});

test('Room player lifecycle and host reassignment', () => {
  const hub = new GameHub();
  const room = hub.createRoom({ socketId: 's1', sessionToken: 'tok1', name: 'आनंद' });
  const p1 = room.getPlayerBySocket('s1');
  assert.equal(p1.isHost, true);

  const p2 = room.addPlayer({ socketId: 's2', sessionToken: 'tok2', name: 'रोहन' });
  assert.equal(p2.isHost, false);
  assert.equal(room.canStart(), true);

  // Reconnect p1 with same token
  const p1Reconnected = room.addPlayer({ socketId: 's1_new', sessionToken: 'tok1', name: 'आनंद' });
  assert.equal(p1Reconnected.sessionToken, 'tok1');
  assert.equal(room.players.size, 2);
});

test('Room game flow: start, pick word, draw, guess, scoring', () => {
  const hub = new GameHub();
  const room = hub.createRoom({ socketId: 's1', sessionToken: 'tok1', name: 'चित्रकार', avatar: '👨‍🎨' });
  room.addPlayer({ socketId: 's2', sessionToken: 'tok2', name: 'ओळखणारा', avatar: '🦊' });

  assert.equal(room.startGame(), true);
  assert.equal(room.state, 'SELECTING_WORD');
  assert.ok(room.wordChoices.length === 3);

  // Drawer picks 2nd choice
  const drawerToken = room.currentDrawerToken;
  const guesserToken = drawerToken === 'tok1' ? 'tok2' : 'tok1';
  const chosenWord = room.wordChoices[1];
  assert.equal(room.selectWord(drawerToken, chosenWord.id), true);
  assert.equal(room.state, 'DRAWING');
  assert.equal(room.currentWord.id, chosenWord.id);

  // Guesser guesses wrong
  const wrongGuess = room.handleGuess(guesserToken, 'चुकीचाशब्द');
  assert.equal(wrongGuess.type, 'chat');

  // Guesser guesses correct
  const correctGuess = room.handleGuess(guesserToken, chosenWord.mr);
  assert.equal(correctGuess.type, 'correct');
  assert.ok(correctGuess.points >= 300);

  const guesser = room.players.get(guesserToken);
  assert.equal(guesser.hasGuessed, true);
  assert.ok(guesser.score >= 300);

  // Drawer cannot guess
  const drawerGuess = room.handleGuess(drawerToken, chosenWord.mr);
  assert.equal(drawerGuess.type, 'drawer_chat');

  // Guesser chatting again after already guessing
  const postGuessChat = room.handleGuess(guesserToken, 'मस्त चित्र!');
  assert.equal(postGuessChat.type, 'guessed_chat');
});

test('Drawing stroke storage, normalized coordinates, undo and redo', () => {
  const room = new Room('TEST', { socketId: 's1', sessionToken: 'tok1', name: 'A' });
  const stroke1 = {
    id: 'st_1',
    tool: 'brush',
    color: '#FF0000',
    sizeRatio: 0.015,
    points: [[0.1, 0.2], [0.15, 0.25], [0.2, 0.3]]
  };
  const stroke2 = {
    id: 'st_2',
    tool: 'pencil',
    color: '#000000',
    sizeRatio: 0.008,
    points: [[0.5, 0.5], [0.6, 0.6]]
  };

  room.addStroke(stroke1);
  room.addStroke(stroke2);
  assert.equal(room.strokes.length, 2);

  // Undo stroke 2
  const undone = room.undoStroke();
  assert.equal(undone.id, 'st_2');
  assert.equal(room.strokes.length, 1);

  // Redo stroke 2
  const redone = room.redoStroke();
  assert.equal(redone.id, 'st_2');
  assert.equal(room.strokes.length, 2);

  // Clear canvas
  room.clearCanvas();
  assert.equal(room.strokes.length, 0);
  assert.equal(room.undoStack.length, 0);
});
