# A scalable networking framework to build realtime multiplayer games with simultaneously running game rooms

This starter kit allows you to add multiplayer functionality (that follows the [Client/Server strategy](https://www.gabrielgambetta.com/client-server-game-architecture.html)) to your game. It provides a communication framework so that your players can communicate with a central server, in realtime, for the entire duration of the gameplay.

It also allows you to implement a 'game rooms' feature using Node JS worker threads, allowing you to spin up multiple instances of the game, each with a separate group of players.

![Game demo gif](https://user-images.githubusercontent.com/5900152/91305901-ac064900-e7a3-11ea-8fb9-b94ca7310777.gif)

## Games built using this framework

1. Multiplayer space invaders -  [GitHub project](https://github.com/Srushtika/realtime-multiplayer-space-invaders) | [Tutorial](https://dev.to/ablydev/building-a-realtime-multiplayer-browser-game-in-less-than-a-day-part-1-4-14pm) | [Demo](https://space-invaders-multiplayer.herokuapp.com/)

2. Multiplayer Flappy birds -  [GitHub Project](https://github.com/Srushtika/multiplayer-flappy-bird) | [Video tutorial](https://www.youtube.com/watch?v=ReGHyTh1ydU)

(...make a PR to add yours!)

## The tech stack

### On the server side

- [Node JS](https://nodejs.org/en/)
- [Express](https://expressjs.com/)

### On the client side

- [Vanilla JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### Libraries used

- [Ably Realtime](https://www.ably.io)
- [Bootstrap](https://getbootstrap.com/)
- [DotEnv](https://www.npmjs.com/package/dotenv)

## How to run this kit locally

1. Clone this repo

   ```sh
   git clone https://github.com/Srushtika/multiplayer-scalable-game-networking-starter-kit.git
   ```

2. Change directory into the project folder

   ```sh
   cd multiplayer-scalable-game-networking-starter-kit.git
   ```

3. Install the dependencies

   ```sh
   npm install
   ```

4. Create a free account with [Ably Realtime](https://www.ably.io/) to get your Ably API KEY. Add a new file in called `.env` and add the following. (Remember to replace the placeholder with your own API Key. You can get your Ably API key from your Ably dashboard):

   ```
   ABLY_API_KEY=<YOUR-ABLY-API-KEY>
   PORT=5000
   ```

5. Run the server

   ```sh
   node server.js
   ```

6. To see the realtime communication in action, open the app in two separate browser windows side-by-side: [https://localhost:5000](https://localhost:5000)

7. Create a game room in one window and join the room as a 'non-host' player by using the unique code in the other window.

8. Start the game when you are ready and use the arrow keys to publish dummy player input. You will see the change happening at the same time in both the windows.

Voila! Your multiplayer game networking framework is up and running, now replace the game logic with yours and make it your own.

Feel free to share your multiplayer game with me on [Twitter](https://twitter.com/Srushtika), I'll be happy to give it a shoutout!

---

## What's in which file?

### On the server

#### 1. `server.js`

This file has the main server thread. It performs three functions:

- Serve the HTML and JS for front-end clients using Express.
- Authenticate front-end clients with the Ably Realtime service using [Token Auth strategy](https://www.ably.io/documentation/core-features/authentication#token-authentication).
- Create and manage Node JS worker threads when a host player requests to create a new game room.

#### 2. `game-server.js`

This file represents a Node JS worker thread and a new instance of this file will run for every game room created. When the game is finished, the worker thread is killed. When a new player joins or leaves the worker thread communicates with the parent thread (main thread aka server.js) and lets it know the number of players (among other things).

### On the client

#### 1. `index.html` and `index.js`

These files represent the home page where a player can choose to host a new game or join a game using the room's unique code.

<img width="1436" alt="Homepage" src="https://user-images.githubusercontent.com/5900152/92018530-2bb88880-ed4d-11ea-8a4e-1a0b9e9a14d9.png">

#### 2. `game-host.html` and `game-not-host.html`

As the names suggest, these are the HTML files for the host player and non-host player respectively. Being the host of the game allows for additional controls like starting or stopping the game, hence the different views.

a. Staging area for host player

<img width="1436" alt="Host staging" src="https://user-images.githubusercontent.com/5900152/92018519-29562e80-ed4d-11ea-9dd6-55faa1d9047a.png">

b. Game area for host player

<img width="1434" alt="Host game" src="https://user-images.githubusercontent.com/5900152/92018515-29562e80-ed4d-11ea-903d-a4a360a7afa5.png">

c. Staging area for non-host player

<img width="1440" alt="Non host staging" src="https://user-images.githubusercontent.com/5900152/92018521-29eec500-ed4d-11ea-9ffa-1cf495c56642.png">

d. Game area for non-host player

<img width="1435" alt="Non host game" src="https://user-images.githubusercontent.com/5900152/92018512-28250180-ed4d-11ea-8303-7e73c8f335bc.png">

#### 3. `game-started.html` and `game-code-wrong.html`

Again as the names suggest, these pages are shown when a non-host player tries to join a game using a unique code, either when the game has already started or that game code doesn't exist, respectively.

<img width="1356" alt="Game started" src="https://user-images.githubusercontent.com/5900152/92019486-9a4a1600-ed4e-11ea-9aab-ba0eb25e99ef.png">

<img width="1332" alt="Game room doesn't exist" src="https://user-images.githubusercontent.com/5900152/92019580-bc439880-ed4e-11ea-9374-8c757bde36f6.png">

#### 4. `player.js`

This file contains the main front-end logic for both host and non-host type players. It uses ES6 modules to import two other files:

##### 4.a. `modules/renderUpdates.js`

This file contains all the methods that render the game UI on the webpage as per the latest realtime updates.

##### 4.b. `modules/utils.js`

This file contains all the utility methods used in the game.

#### 5. `style.css`

This file has all the styles that are applied on top of Bootstrap styles.

---

## Core concepts

### The communication architecture

Before we look at the architecture and design of the app, we need to understand a few concepts based on which this app is built

#### Client-Server game strategy with an authoritative server

The [Client-Server game building strategy](https://www.gabrielgambetta.com/client-server-game-architecture.html) allows for high scalability when compared to the [Peer-to-Peer strategy](https://web.archive.org/web/20190407004521/https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/). In this design, the game server can be considered as the single source of truth and is responsible to maintain the latest game state at all times. All the players send their state to the game server, which in turn collates them together and sends it back at the same time to all the players.

The client-side script will use this state received from the game server to render the game objects on players' screens accordingly, ensuring all the players are fully in-sync.

![Client/Server game strategy](https://user-images.githubusercontent.com/5900152/90788135-61955000-e2fd-11ea-9448-0e02ab45030a.png)

#### The WebSockets protocol

The [WebSockets protocol](https://www.ably.io/concepts/websockets), unlike HTTP, is a stateful communications protocol that works over TCP. The communication initially starts off as an HTTP handshake, but if both the communicating parties agree to continue over WebSockets then the connection is elevated; giving rise to a full-duplex, persistent connection. This means the connection remains open for the duration that the application is in use. This gives the server a way to initiate any communication and send data to pre-subscribed clients, so they don’t have to keep sending requests inquiring about the availability of new data. Which is exactly what we need in our game!

This project uses [Ably Realtime](https://www.ably.io) to implement WebSocket based realtime messaging between the game server and the players. Ably, by default, deals with scalability, protocol interoperability, reliable message ordering, guaranteed message delivery historical message retention and authentication, so we don't have to. This communication follows the [Pub/Sub messaging pattern](https://www.ably.io/concepts/pub-sub).

##### Publish/Subscribe messaging pattern

[Pub/Sub](https://www.ably.io/concepts/pub-sub) messaging allows various front-end or back-end clients to publish some data and/or subscribe to some data. For any active subscriptions, these clients will receive asynchronous event callbacks when a new message is published.

##### Channels

In any realtime app, there's a lot of moving data involved. [Channels](https://www.ably.io/documentation/core-features/channels) help us group this data logically and let us implement subscriptions per channel. This allowing us to implement the custom callback logic for different scenarios. In the diagram above, each color would represent a channel.

##### Presence

[Presence](https://www.ably.io/documentation/core-features/presence) is an Ably feature using which you can track the connection status of various clients on a channel. In essence, you can see who has just come online and who has left using each client's unique `clientId`

#### Sequence of events with Node JS worker threads (For an example game)

![Sequence of events](https://user-images.githubusercontent.com/5900152/90802008-8cd46b00-e30e-11ea-8c37-5c99a73c8edd.png)

---

## Documentation

### Creating Node JS worker threads

This kit uses Node JS worker threads to create new game rooms so various groups of people can simultaneously play the game.

To create and use Node JS worker threads, from the main thread, you'll need to require the `worker_threads` library:

```js
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  threadId,
  MessageChannel,
} = require('worker_threads');
```

and instance a new worker and pass it two parameters:

a) path to the worker file

b) data as a JSON object

```js
const worker = new Worker('./game-server.js', {
  workerData: {
    hostNickname: hostNickname,
    hostRoomCode: hostRoomCode,
    hostClientId: hostClientId,
  },
});
```

In the worker file, you'll need to require the same library `worker_threads`. You'll have access to the `workerData` object directly. For example, in the worker thread, you can access the host nickname with `workerData.hostNickname`

##### Communication between worker and main threads

The worker thread can publish data to the main thread as follows:

```js
parentPort.postMessage({
  roomCode: roomCode,
  totalPlayers: totalPlayers,
  isGameOn: isGameOn,
  isGameOver: isGameOver,
});
```

In this kit, the worker thread communicates with the main thread on three occasions:

1. When a new player joins the game room.
2. When an existing player leaves the game room.
3. When the game is over and the worker thread is going to be killed.

This information is used by the main server thread to maintain a list of active worker threads, along with the number of players in each.

#### Connecting to Ably

In order to use this kit, you will need an Ably API key. If you are not already signed up, you can [sign up now for a free Ably account](https://www.ably.io/signup). Once you have an Ably account:

- Log into your app dashboard
- Under **Your apps**, click on **Manage app** for any app you wish to use for this tutorial, or create a new one with the **Create New App** button
- Click on the **API Keys** tab
- Copy the secret **API Key** value from your Root key.

The server-side scripts connect to Ably using [Basic Authentication](https://www.ably.io/documentation/core-features/authentication#basic-authentication), i.e. by using the API Key directly as shown below:

```js
const realtime = Ably.Realtime({
  key: ABLY_API_KEY,
  echoMessages: false,
});
```

Note: Setting the `echoMessages` false prevents the server from receiving its own messages.

The main server thread uses Express to listen to HTTP requests. It has an `/auth` endpoint that is used by the client-side scripts to authenticate with Ably using tokens. This is a recommended strategy as placing your secret API Key in a front-end script exposes it to potential misuse. The client-side scripts connect to Ably using [Token Authentication](https://www.ably.io/documentation/core-features/authentication#token-authentication) as shown below:

```js
const realtime = new Ably.Realtime({
  authUrl: '/auth',
});
```

#### Ably channel names used by this project

1. `main-game-thread` - Used by the main server thread to listen for host player entries and leaves via presence, to be able to create new Node JS worker threads for new game rooms.

2. `<unique room code>:primary` - Main game state channel for a particular game room. It'll be used by players to enter or leave presence on the game room and by the worker thread to stream game state updates.

3. `<unique room code>:player-ch-<unique client id>` - Unique channel for every player, which is used to publish their state (or input) to the worker thread for that unique game room. The worker thread is subscribed to one such channel per player.

You can also add any other channels that you may need in your game.

Note: Due to the fact that the above channel names exist in a unique channel namespace identified by the unique room code (separated from channel names with a :), you can guarantee that one game room's data never creeps into the other.

---

## Data structures

The game's worker thread (server) stores all the players in an associative array as a key value pair with the following structure:

```js
globalPlayersState[
   "<unique-player-clientId-1>" : {
      id: "<unique-player-clientId-1>",
      nickname: player.data.nickname,
      isAlive: true,
      isConnected: true,
      score: 0,
      left: '<LEFT-POSITION>',
      top: '<TOP-POSITION>',
      color: '<PLAYER-COLOR>',
   },
   "<unique-player-clientId-2>" : {
      id: "<unique-player-clientId-2>",
      nickname: player.data.nickname,
      isAlive: false,
      isConnected: true,
      score: 0,
      left: '<LEFT-POSITION>',
      top: '<TOP-POSITION>',
      color: '<PLAYER-COLOR>',
   },
]
```

The game's worker thread (server) also keeps a track of all the channels meant for each player's input, so it can attach and detach and from them as needed. This is also stored using an associative array with the following structure:

```js
playerChannels[
   '<unique-player-clientId-1>': {'<channel-instance-object>'},
   '<unique-player-clientId-2>': {'<channel-instance-object>'}
]
```

The global game state of all the players is published by the game's worker thread (server) at a high frequency to all the players. The payload of this game state has the following structure:

```js
gameRoomChannel.publish('game-state', {
  globalPlayersState: globalPlayersState,
  totalPlayers: totalPlayers,
  isGameOn: isGameOn,
  isGameOver: isGameOver,
});
```

The client-side script also stores the game state of each player locally and updates it as per the latest data from the server. This has exactly the same structure as in the server:

```js
localGameState[
   "<unique-player-clientId-1>" : {
      id: "<unique-player-clientId-1>",
      nickname: player.data.nickname,
      isAlive: true,
      isConnected: true,
      score: 0,
      left: '<LEFT-POSITION>',
      top: '<TOP-POSITION>',
      color: '<PLAYER-COLOR>',
   },
   "<unique-player-clientId-2>" : {
      id: "<unique-player-clientId-2>",
      nickname: player.data.nickname,
      isAlive: false,
      isConnected: true,
      score: 0,
      left: '<LEFT-POSITION>',
      top: '<TOP-POSITION>',
      color: '<PLAYER-COLOR>',
   },
]
```

In the example game, HTML divs represent player bodies, so that is stored in another associative array, the attributes of which are updated as per the latest data in the `localGameState`:

```js
playerDivs[
   "<unique-player-clientId-1>" : {'<HTML div element object>'},
   "<unique-player-clientId-2>" : {'<HTML div element object>'}
]
```

---

## Load tests and limits

- All of Ably's messaging limits, broken down by package can be found in a [support article](https://support.ably.com/support/solutions/articles/3000053845-do-you-have-any-connection-message-rate-or-other-limits-on-accounts-).

- We are currently performing load and performance tests on this framework and will update this guide with that info when it's available. If this is important to you, please [leave a message to me directly on Twitter](https://www.twitter.com/Srushtika)
