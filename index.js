//====== Global DOM Variables ======\\
const game = document.querySelector("#game");
const playButton = document.querySelector("#playButton");
const restart = document.querySelector("#restart");
const scoreHtml = document.querySelector("#score");
const highScoreHtml = document.querySelector("#highScore");

//Images
const pathImage = document.querySelector("#path");
const playerImage = document.querySelector("#player");
const barrierImage = document.querySelector("#cardBarrier");
const lavaImage = document.querySelector("#lava");
const shieldImage = document.querySelector("#shield");
const shieldSpriteSheet = document.querySelector("#shieldArc");

//====== Global Variables ======\\
//Class Instances
let path;
let nextPath;
let barrier1;
let barrier2;
let player;
let shield1;
let shield2;
let shield3;
let lava;

//Scoring
let score = 0;
let highScore = 0;
const shieldMultiplier = 10; //Score is increased by number of shields gained * this multiplier (loosing shields does not decrease a player's score)
let distanceMultiplier = 0.01; //Score is increased by number of pixels the player has moved * this multiplier

//FPS Variables
let secondsPassed;
let oldTimeStamp;
let fps = 60; //The game's refresh rate in frames per second

//Important
const speed = 6; //***ToDO:  set this to a linear or polynomial increment over game progress/time
let lavaDamage = 3; //How much damage the player take traversing a lava flow
const difficulty = 1; //Make this change the amount of + other posibilities and maybe incrase sucesfull path random +
let sy = 0; //y coordinate to start clipping
let rendered = 0;

//Other
let lane = -1; //The player initially starts in the upper lane
const renderFrequency = -game.width; //The number is how many pixels the player must progress to get to the next card event (plus at least one gamescreen width to remove double rendering intricacies)
const initialCardStart = 1000; //How many pixels to the right of the game screen's x-axis the cards initially start
let blocked = false; //If the player is currently blocked by a card barrier
let shieldSelected; //The player selected event to run
let gameEnd; //Tracks if the game has ended
let peoplePossibilities = [];
let extraShields = 0;

//====== Initialize Canvas ======\\
const ctx = game.getContext("2d");
game.setAttribute("height", 450); //Set to getComputedStyle(game)["height"] after creating grid in index.html
game.setAttribute("width", 900); //Set to getComputedStyle(game)["width"] after creating grid in index.html

//====== Event Listeners ======\\
window.addEventListener("DOMContentLoaded", function () {
  playButton.addEventListener("click", initializeGame);
  document.addEventListener("keydown", (e) => player.move(e));
  restart.addEventListener("click", () => (gameEnd = true)); //If player clicks restart, end the game (player.number is -100 shields so that game over won't show up)
});

//====== Renderable Classes ======\\
class Path {
  constructor(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = image.width;
    this.height = image.height;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y);
  }
  move() {
    path.x -= speed;
  }
}

class Player {
  constructor(image, x, y, number, cloneImage) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = image.width;
    this.height = image.height;
    this.number = number;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y); //Draw Player Image
    let swidth = 35; //width of the clipped image
    let sheight = 112; //height of the clipped image
    let sx = 0; //x coordinate to start clipping
    let x = this.x + 30; //x corrdinate to start drawing sprite
    let y = this.y - 50; //y corrdinate to start drawing sprite
    // if (this.number > 18) {
    //   this.number = 18;
    // }
    for (rendered; rendered < this.number; rendered++) {
      setTimeout(() => {
        sy += sheight;
      }, 50 * rendered);
    }
    for (rendered; rendered > this.number; rendered--) {
      setTimeout(() => {
        sy -= sheight;
      }, 50 * rendered);
    }
    ctx.drawImage(
      shieldSpriteSheet,
      sx,
      sy,
      swidth,
      sheight,
      x,
      y,
      swidth,
      sheight
    );
  }
  move(e) {
    if (e.key === "w" && lane > -1 && !blocked) {
      lane--; //Move up
    }
    if (e.key === "s" && lane < 1 && !blocked) {
      lane++; //Move down
    }
    switch (lane) {
      case -1:
        player.y = 80; //Lane 1
        break;
      case 0:
        player.y = 220; //Lane 2
        player.render();
        break;
      case 1:
        player.y = 340; //Lane 3
        player.render();
        break;
    }
  }
}

class Event {
  constructor(event, x, y, cardText, image) {
    this.event = event;
    this.x = x;
    this.y = y;
    this.show = true; //If this event is visible, (false when the player selects it)
    this.cardText = cardText;
    this.run = false; //If this event has already run
    this.lavaWidth = 186;
    this.shieldImage = image;
    this.damaged = false; //If the lava flow has already dealt damage or not
  }
  render() {
    if (this.event === "card" && this.show === true) {
      ctx.drawImage(this.shieldImage, this.x, this.y);
      ctx.font = "20px arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      let displayText = "";
      const text = this.cardText.split("");
      const operator = text.splice(0, 1).toString();
      const number = text;
      switch (operator) {
        case "a":
          if (number.length > 1) {
            displayText = `${number[0]} ${number[1]}`;
          } else {
            displayText = `+ ${number[0]}`;
          }
          break;
        case "b":
          displayText = `x ${number[0]}`;
          break;
        case "c":
          displayText = `/ ${number[0]}`;
          break;
      }
      ctx.fillText(
        displayText,
        this.x + this.shieldImage.width / 2,
        this.y + this.shieldImage.height / 2 + 7
      );
    }
    if (this.event === "damage") {
      ctx.drawImage(lavaImage, this.x, this.y);
    }
  }
  move() {
    this.x -= speed;
  }
  action() {
    const action = this.cardText.split("");
    const operator = action.splice(0, 1).toString();
    const number = parseInt(action.join(""));
    //console.log("operator: ", operator, "number: ", number);
    switch (operator) {
      case "a":
        player.number = player.number + number;
        score += number * shieldMultiplier;
        break;
      case "b":
        player.number = player.number * number;
        break;
      case "c":
        player.number = player.number / number;
        break;
    }
    shieldSelected = false; //resets event action and prevents this class method from being called repeatedly
  }
}

class Barrier {
  constructor(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = 210;
  }
  render() {
    ctx.drawImage(this.image, this.x - 30, this.y);
    ctx.drawImage(this.image, this.x - 30, this.y);
  }
  move() {
    this.x -= speed;
  }
}

//====== Initialize Game ======\\
function initializeGame() {
  //Initialize entities to render
  playButton.setAttribute("hidden", "hidden");
  restart.removeAttribute("hidden");
  path = new Path(pathImage, 0, 0);
  nextPath = new Path(pathImage, path.x + path.width, 0);
  barrier1 = new Barrier(barrierImage, initialCardStart, 138);
  barrier2 = new Barrier(barrierImage, initialCardStart, 270);
  player = new Player(playerImage, 150, 80, 3);
  let text = newShieldCount();
  shield1 = new Event("card", initialCardStart, 50, text[0], shieldImage);
  shield2 = new Event("card", initialCardStart, 185, text[1], shieldImage); //CardBarrier
  shield3 = new Event("card", initialCardStart, 330, text[2], shieldImage);
  lava = new Event("damage", initialCardStart + 300, 20);
  gameEnd = false;
  //Run gameLoop at player's device's max frames/second
  window.requestAnimationFrame(gameLoop);
}

//====== Game Functions ======\\
//GameLoop
function gameLoop(timeStamp) {
  //== Path & Game Rendering
  path.move(); //Move the path
  gameRerendering(); //Rerender class instances if neccesary
  path.render();
  nextPath.render();

  //== Move Game Objects
  barrier1.move();
  barrier2.move();
  shield1.move();
  shield2.move();
  shield3.move();
  lava.move();

  //== Take Action
  blocked = checkBarrier();
  if (!shieldSelected) {
    checkShieldSelected();
  } else {
    shieldSelected.action();
  }
  manageLava();
  updateScore();

  //== Render Game Objects
  barrier1.render();
  barrier2.render();
  shield1.render();
  shield2.render();
  shield3.render();
  lava.render();
  player.render();

  //GameOver
  gameOverCheck();

  // Calculate fps
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;
  fps = Math.round(1 / secondsPassed);
  if (!gameEnd) {
    window.requestAnimationFrame(gameLoop);
  }
}

//Checks
function checkShieldSelected() {
  eventArray = [shield1, shield2, shield3];
  eventArray.forEach((event) => {
    yMatch =
      player.y > event.y &&
      player.y + player.height < event.y + event.shieldImage.height;
    if (
      player.x + player.width - 15 > event.x &&
      yMatch === true &&
      event.run === false
    ) {
      event.show = false;
      shield1.run = true;
      shield2.run = true;
      shield3.run = true;
      shieldSelected = event;
    }
  });
}

function checkBarrier() {
  //X's don't quite align (off by about 50) but not sure why
  if (
    player.x > barrier1.x - 50 &&
    player.x < barrier1.x + barrier1.width - 50
  ) {
    return true;
  }
  return false;
}

function gameOverCheck() {
  if ((player.number <= 0 && lava.damaged === true) || gameEnd === true) {
    ctx.clearRect(0, 0, game.width, game.height);
    //If playerclicked hasn't clicked restart
    if (gameEnd != true) {
      ctx.font = "50px sans";
      ctx.fillStyle = "#006400";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", game.width / 2, game.height / 2 - 50);
    }
    restart.setAttribute("hidden", "hidden");
    playButton.removeAttribute("hidden");
    playButton.textContent = "Play Again";
    score = 0; //reset the score
    gameEnd = true; //prevent gameLoop from running again
  }
}

//Other
function gameRerendering() {
  //Create new path if neccesary
  if (path.x + path.width < 0) {
    path = nextPath;
  }
  if (path.x + path.width < game.width) {
    nextPath = new Path(pathImage, path.x + path.width, 0);
  } else {
    nextPath.x -= speed;
  }

  //Create new shields if neccesary
  if (shield1.x < renderFrequency) {
    let text = newShieldCount();
    shield1 = new Event("card", game.width, 50, text[0], shieldImage);
    shield2 = new Event("card", game.width, 185, text[1], shieldImage);
    shield3 = new Event("card", game.width, 330, text[2], shieldImage);
  }
  //Create a new barrier if neccesary
  if (barrier1.x < renderFrequency) {
    barrier1 = new Barrier(barrierImage, game.width, 138);
    barrier2 = new Barrier(barrierImage, game.width, 270);
  }

  //Create new Lava FLow if neccesary
  if (lava.x < renderFrequency) {
    lava = new Event("damage", game.width, 20); //This is not quite the right x positioning
  }
}

function newShieldCount() {
  let result = [];
  let shieldPossibilities = [];
  let randOrder = Math.floor(Math.random() * 3); //Puts the succesfull path in a random lane
  for (i = 0; i < 3; i++) {
    if (i === randOrder) {
      const lowestPossibility = 4 - extraShields; //The lowest number a succesfull path could be is 4 (because each lava flow takes three shields away and you need at least one), and then subtract any extra shields the sucesffull path has
      //Get a random number greater than the lowest possible number
      const rndRequired = randomIntFromInterval(
        lowestPossibility,
        lowestPossibility + 1 //how much bigger can the lowest number be (TODO: make this a factor in difficulty)
      );

      result.push(`a${rndRequired}`);
      extraShields = extraShields - 3 + rndRequired;

      //console.log("Attempt: ", rndRequired, "Extra Shields: ", extraShields);
    } else {
      const operatorPossibilities = [
        "a",
        "a",
        "a",
        "a",
        "a",
        "a",
        "a",
        "a",
        "b",
        "c",
      ]; //A is addition and subtraction, B is multiplication, C = division
      const randOperator = Math.floor(
        Math.random() * operatorPossibilities.length
      );
      const operatorSelection = operatorPossibilities[randOperator];
      switch (operatorSelection) {
        case "a":
          shieldPossibilities = [-1, -2, -3, -4, -5, -6, 0, 1, 2, 3, 4, 5, 6];
          break;
        case "b":
          shieldPossibilities = [1, 2, 2, 2, 2];
          break;
        case "c":
          shieldPossibilities = [1, 2, 2, 2, 2];
          break;
      }
      const randShield = Math.floor(Math.random() * shieldPossibilities.length);
      const shieldSelection = shieldPossibilities[randShield];
      result.push(`${operatorSelection}${shieldSelection}`); //Push the math operator and the number of shields
    }
  }
  return result;
}

function manageLava() {
  //If player is within lava field
  if (
    player.x + player.width < lava.x + lava.lavaWidth &&
    player.x > lava.x &&
    lava.damaged === false
  ) {
    player.number -= lavaDamage;
    lava.damaged = true;
  }
}

function updateScore() {
  score += speed * distanceMultiplier; //increase score
  distanceMultiplier += 0.01;

  if (score > highScore) {
    highScore = score;
  }
  scoreHtml.textContent = `Score: ${Math.floor(score)}`;
  highScoreHtml.textContent = `High Score: ${Math.floor(highScore)}`;
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
