let bullets = [];
let oldButtonPressed = false;
let actionTriggered = false;
let gameOver = false; // NEW: Game state tracker

// Image variables
let bgImg, fgImg, p1Img, p2Img, enemyImg, p1Attack, p2Attack;

// Enemy variables
let enemiesCount = [];
let enemiesHurt = 0;

// Level variables
let levelCount = 1;

// Declare objects globally
let playerOne;
let playerTwo;
let enemiesRside;

function preload() {
  // Load images/animations
  bgImg = loadImage("images/background-levelone.png");
  fgImg = loadImage("images/foreground-level1.png");
  p1Img = loadImage("images/player1.png");
  p2Img = loadImage("images/player2.png");
  enemyImg = loadImage("images/enemiegoop.png");
  
  // GIFs load easily in standard p5.js as well
  p1Attack = loadImage("images/paintattackleft.gif");
  p2Attack = loadImage("images/riffattackleft.gif");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Draw images from their center to make collision math accurate
  imageMode(CENTER);

  // Initialize player variables
  playerOne = new Player1();
  playerTwo = new Player2();
  
  // Initialize Enemy variables
  enemiesRside = new enemyRightSide();
  for (let i = 0; i < 10; i++) {
    enemiesCount.push(new enemyLeftSide());
  }
}

function draw() {
  // 1. Draw Background First
  image(bgImg, windowWidth / 2, windowHeight / 2, windowWidth, windowHeight);
  
  // NEW: Game Over / Victory Screen Loop
  if (gameOver) {
    image(fgImg, windowWidth / 2, windowHeight / 2, windowWidth, windowHeight);
    
    push();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(80);
    text("YOU WIN!", windowWidth / 2, windowHeight / 2 - 40);
    
    textSize(30);
    text("Press 'R' (or Controller Button) to Restart", windowWidth / 2, windowHeight / 2 + 50);
    pop();
    
    // Check if controller is trying to restart
    checkControllerRestart();
    
    return; // This stops the rest of the draw loop from running while on the victory screen
  }

  // 2. Player display and movement
  playerOne.display();
  playerOne.move();

  playerTwo.display();
  playerTwo.move();
  
  // Call controller attack function for Player 2
  xAttack();

  // 3. Enemy Logic
  let maxEnemyIndex = enemiesCount.length - 1;
  let a = Math.min(levelCount * 3, maxEnemyIndex);
  
  for (; a >= 0; a--) {
    if (enemiesCount[a]) {
      enemiesCount[a].update();
      enemiesCount[a].display();

      // Check if the enemy's X position reached the middle
      if (enemiesCount[a].x >= windowWidth / 2) { 
        levelCount--; // Decrease score by 1
        
        // Prevent the score from going into negative numbers
        if (levelCount < 0) {
          levelCount = 0;
        }

        // Reset the enemy off-screen to the left so they can charge again
        enemiesCount[a].x = -100;
        enemiesCount[a].y = random(windowHeight / 2, windowHeight);
      }
    }
  }
  
  // 4. Manage Bullets & Collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();

    for (let j = 0; j <= 6; j++) {
      if (enemiesCount[j]) {
        let dL = dist(bullets[i].x, bullets[i].y, enemiesCount[j].x, enemiesCount[j].y);

        if (dL < (enemiesCount[j].size / 2) + (bullets[i].size / 2)) {
          bullets.splice(i, 1); 
          enemiesCount[j].x = -100; 
          enemiesCount[j].y = random(windowHeight / 2, windowHeight);
          enemiesHurt += 1;
          break; 
        }
      }
      
      // Level progression check
      if (enemiesHurt > 3) {
        levelCount++;
        if (enemiesCount[j]) {
          enemiesCount[j].speedX += 0.5;
        }
        enemiesHurt = 0; 
      }
    }
    
    // Remove bullet if it goes off-screen
    if (bullets[i] && (bullets[i].y < 0 || bullets[i].x < 0 || bullets[i].x > width)) {
      bullets.splice(i, 1);
    }
  }
  
  // 5. Draw Foreground Last (so it overlays players and enemies)
  image(fgImg, windowWidth / 2, windowHeight / 2, windowWidth, windowHeight);
  
  // 6. Draw UI
  fill(255);
  textSize(24);
  text("Score: " + levelCount, 40, 40);

  // NEW: Check for Win Condition
  if (levelCount >= 100) {
    gameOver = true;
  }
}
 
// --- CLASSES ---

class Player1 {
  constructor() {
    this.x = windowWidth / 2 - 100; 
    this.y = (windowHeight / 2) + 25;
    this.size = 150;
    this.speed = 5;
    this.facing = 1; 
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.facing, 1); 
    image(p1Img, 0, 0, this.size, this.size);
    pop();
  }

  move() {
    if (keyIsDown(UP_ARROW)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW)) this.y += this.speed;
    
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
      this.facing = -1;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
      this.facing = 1; 
    }

    this.x = constrain(this.x, 0, windowWidth - 50);
    this.y = constrain(this.y, (windowHeight / 2), windowHeight - 50);
  }
}

class Player2 {
  constructor() {
    this.x = windowWidth / 2 + 100;
    this.y = (windowHeight / 2) + 25;
    this.size = 150;
    this.speed = 5;
    this.facing = 1; 
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.facing, 1); 
    image(p2Img, 0, 0, this.size, this.size);
    pop();
  }

  move() {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = gamepads[0];
 
    if (gp) {
      let x = gp.axes[0];
      let y = gp.axes[1];
      let aimX = gp.axes.length > 2 ? gp.axes[2] : 0;
   
      if (Math.abs(x) > 0.1) {
        this.x += x * 5;
        if (Math.abs(aimX) <= 0.1) {
           this.facing = x > 0 ? 1 : -1;
        }
      }
      if (Math.abs(y) > 0.1) this.y += y * 5;

      if (Math.abs(aimX) > 0.1) {
        this.facing = aimX > 0 ? 1 : -1;
      }
    }

    this.x = constrain(this.x, 0, windowWidth - 50);
    this.y = constrain(this.y, (windowHeight / 2), windowHeight - 50);
  }
}

class enemyLeftSide {
  constructor(){
    this.x = 10;
    this.y = random(windowHeight / 2, windowHeight);
    this.size = 100; 
    this.speedY = 0.5;
    this.speedX = 1.5;
  }
 
  display(){
    image(enemyImg, this.x, this.y, this.size, this.size);
  }
 
  update() {
    let targetX = windowWidth / 2;
    let targetY = (windowHeight / 4) * 2.75;
   
    if (this.x < (targetX - 1)) this.x += this.speedX;
    
    if (this.x > 100){
      if (this.y > targetY) this.y -= this.speedY;
      else if (this.y < targetY) this.y += this.speedY;
      else this.y -= 20;
    }
  }
}

class enemyRightSide {
  constructor(){
    this.x = windowWidth - 10;
    this.y = random(windowHeight / 2, windowHeight);
    this.size = 60;
    this.speedY = 0.5;
    this.speedX = 1.5;
  }
 
  display(){
    image(enemyImg, this.x, this.y, this.size, this.size);
  }
 
  update() {
    let targetX = windowWidth / 2;
    let targetY = (windowHeight / 4) * 2.75;
   
    if (this.x > (targetX + 1)) this.x -= this.speedX;
    
    if (this.x < windowWidth - 100){
      if (this.y > targetY) this.y -= this.speedY;
      else if (this.y < targetY) this.y += this.speedY;
      else this.y -= 10;
    }
  }
}

class Bullet {
  constructor(x, y, direction, attackImg) {
    this.x = x;
    this.y = y;
    this.size = 100; 
    this.speed = 5;
    this.direction = direction; 
    this.attackImg = attackImg; 
  }
 
  update() {
    this.x += this.speed * this.direction;
  }
 
  display() {
    push(); 
    translate(this.x, this.y);
    scale(this.direction * -1, 1); 
    blendMode(MULTIPLY); 
    
    image(this.attackImg, 0, 0, this.size, this.size); 
    pop(); 
  }
}

// --- INPUT & RESET FUNCTIONS ---

function restartGame() {
  // Reset stats
  levelCount = 1;
  enemiesHurt = 0;
  bullets = [];
  
  // Reset players to their starting positions
  playerOne.x = windowWidth / 2 - 100;
  playerOne.y = (windowHeight / 2) + 25;
  playerTwo.x = windowWidth / 2 + 100;
  playerTwo.y = (windowHeight / 2) + 25;
  
  // Clear and respawn enemies
  enemiesCount = [];
  for (let i = 0; i < 10; i++) {
    enemiesCount.push(new enemyLeftSide());
  }
  
  // Turn off the game over screen
  gameOver = false;
}

function keyPressed() {
  if (gameOver) {
    if (key === 'r' || key === 'R') {
      restartGame();
    }
    return; // Prevent attacking while the game over screen is up
  }

  if (key === 'd' || key === 'D') {
    bullets.push(new Bullet(playerOne.x, playerOne.y, playerOne.facing, p1Attack));
  }
}

function xAttack(){
  if (gameOver) return; // Don't allow attacking while game over screen is up

  let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = gamepads[0]; 

  if (gp && gp.buttons && gp.buttons[0]) {
    let currentButtonPressed = gp.buttons[0].pressed;

    if (currentButtonPressed && !oldButtonPressed) {
      bullets.push(new Bullet(playerTwo.x, playerTwo.y, playerTwo.facing, p2Attack));
      actionTriggered = !actionTriggered; 
    }

    oldButtonPressed = currentButtonPressed;
  }
}

function checkControllerRestart() {
  let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = gamepads[0]; 

  if (gp && gp.buttons && gp.buttons[0]) {
    let currentButtonPressed = gp.buttons[0].pressed;

    if (currentButtonPressed && !oldButtonPressed) {
      restartGame();
    }

    oldButtonPressed = currentButtonPressed;
  }
}