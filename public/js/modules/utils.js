/* eslint-disable require-jsdoc */
'use strict';

const PLAYER_GAME_AREA_WIDTH = 800;
const PLAYER_GAME_AREA_HEIGHT = 400;

function calculateAndMovePlayer(e, myLeft, myTop) {
  let playerMove = false;
  switch (e.keyCode) {
    case 37: // leftArrowKey
      if (myLeft >= 20) {
        myLeft -= 20;
        playerMove = true;
      }
      break;
    case 39: // rightArrowKey
      if (myLeft <= PLAYER_GAME_AREA_WIDTH - 20) {
        myLeft += 20;
        playerMove = true;
      }
      break;
    case 38: // upArrowKey
      if (myTop >= 20) {
        myTop -= 20;
        playerMove = true;
      }
      break;
    case 40: // downArrowKey
      if (myTop <= PLAYER_GAME_AREA_HEIGHT - 20) {
        myTop += 20;
        playerMove = true;
      }
      break;
  }

  return [playerMove, myLeft, myTop];
}

export { calculateAndMovePlayer };
