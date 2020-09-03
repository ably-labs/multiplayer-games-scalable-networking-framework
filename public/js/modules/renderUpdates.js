/* eslint-disable require-jsdoc */
'use strict';
const playerDivs = {};
const gameAreaParentDiv = document.getElementById('game-area');

// method to update the game display
function updateGameDisplay(
  localGameState,
  myGameRoomCode,
  myClientId,
  myNickname,
  amIHost
) {
  // loop through all the players in the local game state
  // associative array and create or move their block as per their latest positon
  for (const item in localGameState) {
    if (!playerDivs[item] && localGameState[item].isAlive) {
      playerDivs[item] = {};
      playerDivs[item].el = document.createElement('div');
      playerDivs[item].el.classList.add('player-block');
      gameAreaParentDiv.appendChild(playerDivs[item].el);
      playerDivs[item].el.style.left = localGameState[item].left + 'px';
      playerDivs[item].el.style.top = localGameState[item].top + 'px';
      playerDivs[item].el.style.backgroundColor = localGameState[item].color;
      if (item === myClientId) {
        document.getElementById(
          'player-color-indicator'
        ).style.backgroundColor = localGameState[item].color;
        document.getElementById('player-room-info').innerHTML =
          '&nbsp in &ldquo;' +
          myGameRoomCode +
          '&rdquo; with clientId &ldquo;' +
          myClientId +
          '&rdquo; and nickname &ldquo;' +
          myNickname +
          '&rdquo;';
      }
    } else if (playerDivs[item]) {
      playerDivs[item].el.style.left = localGameState[item].left + 'px';
      playerDivs[item].el.style.top = localGameState[item].top + 'px';
    }
  }
}

// method to add presence updates to a list
function updatePresenceList(playerNickname, update, amIHost, totalPlayers) {
  const listItem = `<li class="list-group-item"> ${playerNickname} ${update}</li>`;
  if (amIHost) {
    const listEl = document.getElementById('host-players-list');
    listEl.innerHTML += listItem;
    listEl.scrollTop = listEl.scrollHeight;
    document.getElementById('player-count').innerHTML =
      totalPlayers + ' player(s) online including you';
  } else {
    const listEl = document.getElementById('not-host-players-list');
    listEl.innerHTML += listItem;
    listEl.scrollTop = listEl.scrollHeight;
  }
}

// method to add game updates to a list
function updateGameNewsList(playerNickname, update) {
  const listItem = `<li class="list-group-item"> ${playerNickname} ${update}</li>`;
  const listEl = document.getElementById('game-updates-list');
  listEl.innerHTML += listItem;
  listEl.scrollTop = listEl.scrollHeight;
}

// method to add a blink effect adn remove the player from the game area
// and the associative array
function blinkAndRemovePlayer(playerId) {
  let blinkCount = 0;
  const blinkInterval = setInterval(function () {
    if (blinkCount >= 5) {
      gameAreaParentDiv.removeChild(playerDivs[playerId].el);
      delete playerDivs[playerId];
      clearInterval(blinkInterval);
    } else {
      playerDivs[playerId].el.style.display =
        playerDivs[playerId].el.style.display === 'none' ? '' : 'none';
      blinkCount++;
    }
  }, 250);
}

function showGameArea(amIHost) {
  if (amIHost) {
    document.getElementById('host-waiting').style.display = 'none';
    document.getElementById('host-gameplay').style.display = 'block';
  } else {
    document.getElementById('not-host-waiting').style.display = 'none';
    document.getElementById('not-host-gameplay').style.display = 'block';
  }
}

function showEndGameAlert(amIHost) {
  amIHost === true
    ? (document.getElementById('alert-host').style.display = 'block')
    : (document.getElementById('alert-not-host').style.display = 'block');
}

function showRoomCodeToShare(roomCode) {
  const roomNotReadyDiv = document.getElementById('room-not-ready');
  roomNotReadyDiv.style.display = 'none';
  const roomReadyDiv = document.getElementById('room-ready');
  roomReadyDiv.style.display = 'block';
  document.getElementById('random-room-code').innerHTML = roomCode;
}

export {
  updateGameDisplay,
  updatePresenceList,
  updateGameNewsList,
  blinkAndRemovePlayer,
  showGameArea,
  showEndGameAlert,
  showRoomCodeToShare
};
