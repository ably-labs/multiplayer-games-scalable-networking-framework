/* eslint-disable require-jsdoc */
/**
 * This is the game server for
 * a single game room
 */
const { parentPort, workerData } = require('worker_threads');
// eslint-disable-next-line no-unused-vars
const envConfig = require('dotenv').config();
const Ably = require('ably');

const ABLY_API_KEY = process.env.ABLY_API_KEY;
const GAME_STATE_PUBLISH_FREQ_MS = 100;
const PLAYER_GAME_AREA_WIDTH = 790;
const PLAYER_GAME_AREA_HEIGHT = 390;
const globalPlayersState = {};
const playerChannels = {};
let isGameOn = false;
let isGameOver = false;
let totalPlayers = 0;
const gameRoomChName = workerData.hostRoomCode + ':primary';
const roomCode = workerData.hostRoomCode;
const hostClientId = workerData.hostClientId;
let gameRoomChannel;
let gameTickerOn = false;

// instantiate Ably
// eslint-disable-next-line new-cap
const realtime = Ably.Realtime({
  key: ABLY_API_KEY,
  echoMessages: false
});

// wait until connection with Ably is established
realtime.connection.once('connected', () => {
  // create the channel object
  gameRoomChannel = realtime.channels.get(gameRoomChName);

  // subscribe to new players entering the game via 'presence'
  gameRoomChannel.presence.subscribe('enter', (player) => {
    const newPlayerId = player.clientId;
    totalPlayers++;
    /**
     * let the main thread know the
     * updated number of players
     */
    parentPort.postMessage({
      roomCode: roomCode,
      totalPlayers: totalPlayers,
      isGameOn: isGameOn,
      isGameOver: isGameOver
    });

    // start publishing game updates as soon as the
    // first player joins
    if (totalPlayers === 1) {
      gameTickerOn = true;
      startGameDataTicker();
    }

    // create an initial object for this
    // newly joined player
    newPlayerState = {
      id: newPlayerId,
      nickname: player.data.nickname,
      isAlive: true,
      isConnected: true,
      score: 0,
      left: Math.round(Math.random() * PLAYER_GAME_AREA_WIDTH + 1),
      top: Math.round(Math.random() * PLAYER_GAME_AREA_HEIGHT + 1),
      color: randomColorGenerator()
    };
    // add the new player's state object to the
    // global players state associative array
    globalPlayersState[newPlayerId] = newPlayerState;

    // get the unique channel for this player
    playerChannels[newPlayerId] = realtime.channels.get(
      roomCode + ':player-ch-' + player.clientId
    );
    // subscribe to this player's state on their unique channel
    subscribeToPlayerState(playerChannels[newPlayerId], newPlayerId);
  });

  // subscribe to players leaving the game via presence
  gameRoomChannel.presence.subscribe('leave', (player) => {
    const leavingPlayerId = player.clientId;
    totalPlayers--;
    globalPlayersState[leavingPlayerId].isConnected = false;
    /**
     * optionally let the main thread know the
     * number of players
     */
    parentPort.postMessage({
      roomCode: roomCode,
      totalPlayers: totalPlayers
    });

    /**
     * delete this players entry from the
     * associative array after waiting a bit
     * to make sure the players have received at least one
     * server tick update declaring this player disconnected
     */
    setTimeout(() => {
      delete globalPlayersState[leavingPlayerId];
    }, GAME_STATE_PUBLISH_FREQ_MS * 2);

    /**
     * if it's the last player to leave, kill the woker thread
     * aka the game server for this game room
     */
    if (totalPlayers <= 0) {
      killWorkerThread();
    }
  });

  /**
   * let the host player know that the game room
   * is ready, so they can enter via presence
   * and let other players do so too
   *  */
  gameRoomChannel.publish('thread-ready', {
    start: true
  });
});

/**
 * method to start the server game ticker
 * to continuously stream the global state
 * to all the players connected
 *  */
function startGameDataTicker() {
  const tickInterval = setInterval(() => {
    if (!gameTickerOn) {
      clearInterval(tickInterval);
    } else {
      // publish the latest game state
      gameRoomChannel.publish('game-state', {
        globalPlayersState: globalPlayersState,
        totalPlayers: totalPlayers,
        isGameOn: isGameOn,
        isGameOver: isGameOver
      });
    }
  }, GAME_STATE_PUBLISH_FREQ_MS);
}

// subscribe to player channel to get their latest state
function subscribeToPlayerState(playerChannel, playerId) {
  // subscribe to the player state event where
  // the players will send their state updates
  playerChannel.subscribe('player-state', (msg) => {
    const { left, top } = msg.data;
    const state = globalPlayersState[playerId];
    globalPlayersState[playerId] = { ...state, left, top };
  });

  // subscribe to the player death event
  playerChannel.subscribe('player-dead', (msg) => {
    globalPlayersState[msg.data.deadPlayerId].isAlive = false;
  });
  // subscribe to events that only the game host can publish
  if (playerId === hostClientId) {
    playerChannel.subscribe('start-game', (msg) => {
      if (!isGameOn) {
        isGameOn = true;
        parentPort.postMessage({
          roomCode: roomCode,
          totalPlayers: totalPlayers,
          isGameOn: isGameOn,
          isGameOver: isGameOver
        });
      }
    });
    playerChannel.subscribe('end-game', (msg) => {
      if (isGameOn) {
        isGameOn = false;
        isGameOver = true;
      }
    });
  }
}

// kill the worker thread
function killWorkerThread() {
  // detach from all the channels to immediately
  // bring the active channel count down
  for (const item in playerChannels) {
    if ({}.hasOwnProperty.call(playerChannels, item)) {
      playerChannels[item].detach();
    }
  }
  gameRoomChannel.detach();
  // publish a message to the main thread befoe this thread exits
  parentPort.postMessage({
    killWorker: true,
    roomCode: roomCode,
    totalPlayers: totalPlayers
  });
  process.exit(0);
}

// method to randomly generate a color for the player
function randomColorGenerator() {
  return '#' + Math.random().toString(16).slice(-6);
}
