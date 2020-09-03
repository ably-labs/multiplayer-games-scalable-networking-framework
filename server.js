/* eslint-disable require-jsdoc */
/**
 * This is the main server file, responsible for three operations:
 * 1. Server the HTML/JS files to the players
 * 2. Serve as an auth server to authenticate front-end clients
 *    with Ably and assign a unique clientId to each player
 * 3. Create a new worker thread for each game room using NodeJS worker threads
 */
const { Worker, isMainThread, threadId } = require('worker_threads');
// eslint-disable-next-line no-unused-vars
const envConfig = require('dotenv').config();
const express = require('express');
const Ably = require('ably');

const app = express();
const ABLY_API_KEY = process.env.ABLY_API_KEY;
const globalGameChName = 'main-game-thread';

let globalChannel;
const activeGameRooms = {};
let totalPlayersThroughout = 0;

// instantiate the Ably library
// eslint-disable-next-line new-cap
const realtime = Ably.Realtime({
  key: ABLY_API_KEY,
  // echo messages client option is true by default
  // making it false will prevent the server from
  // receiving the messages published by it
  echoMessages: false
});

app.use(express.static('public'));

/**
 * the auth endpoint will allow front end clients to
 * authenticate with Ably using Token auth
 */
app.get('/auth', (request, response) => {
  // assign each front-end client a unique clientId
  const tokenParams = { clientId: uniqueId() };
  realtime.auth.createTokenRequest(tokenParams, function (err, tokenRequest) {
    if (err) {
      response
        .status(500)
        .send('Error requesting token: ' + JSON.stringify(err));
    } else {
      // return the token request to the front-end client
      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify(tokenRequest));
    }
  });
});

// create a uniqueId to assign to clients on auth
const uniqueId = function () {
  return 'id-' + Math.random().toString(36).substr(2, 16);
};

// show the index.html file on the home page
app.get('/', (request, response) => {
  response.sendFile(__dirname + '/public/views/index.html');
});

// show the game html page to the client
app.get('/game', (request, response) => {
  const requestedRoomCode = request.query.roomCode;
  const isReqHost = request.query.isHost === 'true';
  /**
   * check if the requested game room exists
   * and if the client is a host or not,
   * and serve the HTML files accordingly
   *  */
  if (!isReqHost && activeGameRooms[requestedRoomCode]) {
    if (!activeGameRooms[requestedRoomCode].isGameOn) {
      response.sendFile(__dirname + '/public/views/game-not-host.html');
    } else {
      response.sendFile(__dirname + '/public/views/game-started.html');
    }
  } else if (isReqHost) {
    response.sendFile(__dirname + '/public/views/game-host.html');
  } else {
    response.sendFile(__dirname + '/public/views/game-code-wrong.html');
  }
});

// add a listener for the express server
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

// wait until connection with Ably is established
realtime.connection.once('connected', () => {
  // create the channel object
  globalChannel = realtime.channels.get(globalGameChName);
  // subscribe to new host players entering the game
  globalChannel.presence.subscribe('enter', (player) => {
    // generate a new worker thread for each game room
    generateNewGameThread(
      player.data.isHost,
      player.data.nickname,
      player.data.roomCode,
      player.clientId
    );
  });
});

// method to create and update a new worker thread
function generateNewGameThread(
  isHost,
  hostNickname,
  hostRoomCode,
  hostClientId
) {
  if (isHost && isMainThread) {
    const worker = new Worker('./game-server.js', {
      workerData: {
        hostNickname: hostNickname,
        hostRoomCode: hostRoomCode,
        hostClientId: hostClientId
      }
    });
    console.log(`CREATING NEW THREAD WITH ID ${threadId}`);
    worker.on('error', (error) => {
      console.log(`WORKER EXITED DUE TO AN ERROR ${error}`);
    });
    // wait for an update from the worker thread to confirm it's created
    worker.on('message', (msg) => {
      if (msg.roomCode && !msg.killWorker) {
        // save all live threads in an associative array
        activeGameRooms[msg.roomCode] = {
          roomCode: msg.roomCode,
          totalPlayers: msg.totalPlayers,
          isGameOn: msg.isGameOn
        };
        totalPlayersThroughout += totalPlayersThroughout;
      } else if (msg.roomCode && msg.killWorker) {
        // delete the thread entry from the associative array
        // if the killWorker method was invoked in the thread
        totalPlayersThroughout -= msg.totalPlayers;
        delete activeGameRooms[msg.roomCode];
      }
    });
    // check if any error occurs when a worker thread quits
    worker.on('exit', (code) => {
      console.log(`WORKER EXITED WITH THREAD ID ${threadId}`);
      if (code !== 0) {
        console.log(`WORKER EXITED DUE TO AN ERROR WITH CODE ${code}`);
      }
    });
  }
}
