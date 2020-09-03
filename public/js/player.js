/* eslint-disable require-jsdoc */
'use strict';
import * as renderModule from './modules/renderUpdates.js';
import * as utilsModule from './modules/utils.js';

const playerVars = {
  myClientId: '',
  localGameState: {},
  isGameOn: false,
  totalPlayers: 1,
  endGameClicked: false,
  myNickname: localStorage.getItem('nickname'),
  myGameRoomCode: localStorage.getItem('roomCode'),
  amIHost: localStorage.getItem('isHost') === 'true'
};

const channelNames = {
  myPublishChName: '',
  globalChName: '',
  myGameRoomChName: playerVars.myGameRoomCode + ':primary'
};

const channelInstances = {
  myPublishChannel: '',
  myGameRoomChannel: '',
  globalChannel: ''
};

window.copyCode = copyCode;
window.startGame = startGame;
window.endGame = endGame;
window.fakeDeath = fakeDeath;

document.addEventListener('keydown', move);

// instantiate the Ably library
// authenticate via Token Auth strategy
const realtime = new Ably.Realtime({
  authUrl: '/auth'
});

// wait until connection with Ably is established
realtime.connection.once('connected', () => {
  // save the current players clientId
  playerVars.myClientId = realtime.auth.clientId;
  // call a method to attach to channels
  attachChannels();

  // request a new worker thread or enter existing
  if (playerVars.amIHost) {
    waitForGameRoom();
    enterMainThread();
  } else {
    enterGameRoom();
  }
  receiveGlobalGameState();
});

// method to attach to channels
function attachChannels() {
  // channel to publish player input
  channelNames.myPublishChName =
    playerVars.myGameRoomCode + ':player-ch-' + playerVars.myClientId;
  channelInstances.myPublishChannel = realtime.channels.get(
    channelNames.myPublishChName
  );
  // channel to receive global game state updates
  channelInstances.myGameRoomChannel = realtime.channels.get(
    channelNames.myGameRoomChName
  );
}

// method to wait for the worker thread to be ready
function waitForGameRoom() {
  channelInstances.myGameRoomChannel.subscribe('thread-ready', (msg) => {
    channelInstances.globalChannel.detach();
    enterGameRoom();
    renderModule.showRoomCodeToShare(playerVars.myGameRoomCode);
  });
}

// method to enter presence on the main server thread (for hosts only)
function enterMainThread() {
  channelNames.globalChName = 'main-game-thread';
  channelInstances.globalChannel = realtime.channels.get(
    channelNames.globalChName
  );
  channelInstances.globalChannel.presence.enter({
    nickname: playerVars.myNickname,
    roomCode: playerVars.myGameRoomCode,
    isHost: playerVars.amIHost
  });
}

// method to enter presence on the game server worker thread (for all players)
function enterGameRoom() {
  channelInstances.myGameRoomChannel.presence.enter({
    nickname: playerVars.myNickname,
    isHost: playerVars.amIHost
  });
}

// method to subscribe to global game state updates from game server
function receiveGlobalGameState() {
  channelInstances.myGameRoomChannel.subscribe('game-state', (msg) => {
    if (msg.data.isGameOn && !playerVars.isGameOn) {
      renderModule.showGameArea(playerVars.amIHost);
      playerVars.isGameOn = true;
    }
    if (!msg.data.isGameOver) {
      updateLocalState(msg.data);
    } else {
      endGameAndCleanup(msg.data.isGameOn);
    }
  });
}

// method to update local variables based on the update received from the server
function updateLocalState(msgData) {
  playerVars.totalPlayers = msgData.totalPlayers;
  for (const item in msgData.globalPlayersState) {
    if (
      playerVars.localGameState[item] &&
      msgData.globalPlayersState[item].isConnected
    ) {
      handlePlayerStateUpdate(msgData.globalPlayersState[item], item);
    } else if (
      playerVars.localGameState[item] &&
      !msgData.globalPlayersState[item].isConnected
    ) {
      handleExistingPlayerLeft(
        msgData.data.globalPlayersState[item].nickname,
        item
      );
    } else if (
      !playerVars.localGameState[item] &&
      msgData.globalPlayersState[item].isConnected
    ) {
      handleNewPlayerJoined(msgData.globalPlayersState[item], item);
    }
  }

  // call a method to update the game display as per latest state
  renderModule.updateGameDisplay(
    playerVars.localGameState,
    playerVars.myGameRoomCode,
    playerVars.myClientId,
    playerVars.myNickname,
    playerVars.amIHost
  );
}

// method to end the game and detach from channels
function endGameAndCleanup(isGlobalGameOn) {
  if (!isGlobalGameOn && playerVars.isGameOn) {
    renderModule.showEndGameAlert(playerVars.amIHost);
    channelInstances.myGameRoomChannel.detach();
    channelInstances.myPublishChannel.detach();
    realtime.connection.close();
    // redirect to the homepage after a bit
    setTimeout(() => {
      if (!playerVars.endGameClicked) {
        window.location.replace('/?restart');
      }
      playerVars.endGameClicked = true;
    }, 3000);
  }
}

// method to update the UI as per player state
function handlePlayerStateUpdate(globalState, playerId) {
  const { isAlive, nickname } = globalState;
  if (isAlive) {
    playerVars.localGameState[playerId] = {
      ...globalState
    };
  } else if (!isAlive && playerVars.localGameState[playerId].isAlive) {
    playerVars.localGameState[playerId].isAlive = false;
    renderModule.updateGameNewsList(nickname, 'died');
    renderModule.blinkAndRemovePlayer(playerId);
  }
}

// method to handle a player leaving the game
function handleExistingPlayerLeft(nickname, playerId) {
  renderModule.blinkAndRemovePlayer(playerId);
  if (!playerVars.isGameOn) {
    renderModule.updatePresenceList(
      nickname,
      'left',
      playerVars.amIHost,
      playerVars.totalPlayers
    );
  } else {
    renderModule.updateGameNewsList(nickname, 'left');
  }
  delete playerVars.localGameState[playerId];
}

// method to handle a new player joining the game
function handleNewPlayerJoined(newPlayerState, playerId) {
  // create a new entry for this player and copy the latest state from the server
  playerVars.localGameState[playerId] = { ...newPlayerState };
  // update the presence list
  renderModule.updatePresenceList(
    newPlayerState.nickname,
    'joined',
    playerVars.amIHost,
    playerVars.totalPlayers
  );
}

// method to handle keydown events
function move(e) {
  const playerPosition = utilsModule.calculateAndMovePlayer(
    e,
    playerVars.localGameState[playerVars.myClientId].left,
    playerVars.localGameState[playerVars.myClientId].top
  );
  if (playerPosition[0]) {
    channelInstances.myPublishChannel.publish('player-state', {
      left: playerPosition[1],
      top: playerPosition[2]
    });
  }
}

// method to start the game
// only game hosts have this button
function startGame() {
  channelInstances.myPublishChannel.publish('start-game', {
    startGame: true
  });
}

// method to end the game
// only game hosts have this button
function endGame() {
  channelInstances.myPublishChannel.publish('end-game', {
    endGame: true
  });
}

// method to fake death
// all players have this button
function fakeDeath() {
  channelInstances.myPublishChannel.publish('player-dead', {
    deadPlayerId: playerVars.myClientId
  });
}

// method to copy the room code to clipboard on button click
function copyCode() {
  navigator.clipboard.writeText(playerVars.myGameRoomCode);
}
