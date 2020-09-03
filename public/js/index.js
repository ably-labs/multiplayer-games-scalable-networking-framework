/* eslint-disable require-jsdoc */
'use strict';

/**
 * method to create or join a room on button click
 */
// eslint-disable-next-line no-unused-vars
function createOrJoin(action) {
  localStorage.clear();
  let roomCode;
  const isHost = action === 'create';
  const nickname = document.getElementById(action + '-nickname').value;
  if (isHost) {
    roomCode = getRandomRoomId();
  } else {
    roomCode = document.getElementById('join-room-code').value;
  }
  localStorage.setItem('isHost', isHost);
  localStorage.setItem('nickname', nickname);
  localStorage.setItem('roomCode', roomCode);
  window.location.replace('/game?roomCode=' + roomCode + '&isHost=' + isHost);
}

// method to generate a random room Id
function getRandomRoomId() {
  return 'room-' + Math.random().toString(36).substr(2, 8);
}
