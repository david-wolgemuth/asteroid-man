$(document).ready(function() {
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
$(document).on('keydown', function (event) {
    if (event.keyCode == 32) {
        event.preventDefault();
        Jump();
    }
});
// listen for clicks
$("#canvas").on('touchstart', function(event) {
    event.preventDefault();
    Jump();
});

var x = 150;
var y = 150;
var dx = 2;
var dy = 4;
var WIDTH;
var HEIGHT;
var ctx;

var IMAGES = {
    falling: {
        right: [],
        left: []
    },
    jumping: {
        right: [],
        left: [],
    },
    jetPack: [],
    platform: [],
    coin: [],
    starfield: undefined,
    fuelTank: undefined,
    asteroid: undefined,
};

loadImages();
function loadImages() {
    var falling_pngs = [];
    var left;
    var right;
    var pngLeft;
    var pngRight;
    for (var i = 0; i < 15; i++) {
        left = 'images/falling-left/' + i + '.png';
        right = 'images/falling-right/' + i + '.png';
        falling_pngs.push([left, right]);
    }
    for (i = 0; i < falling_pngs.length; i++) {
        left = falling_pngs[i][0];
        right = falling_pngs[i][1];
        pngLeft = new Image();
        pngRight = new Image();
        pngLeft.src = left;
        pngRight.src = right;
        IMAGES.falling.left.push(pngLeft);
        IMAGES.falling.right.push(pngRight);
    }
    var jumping_pngs = [];
    for (i = 0; i < 9; i++) {
        left = 'images/jumping-left/' + i + '.png';
        right = 'images/jumping-right/' + i + '.png';
        jumping_pngs.push([left, right]);
    }
    for (i = 0; i < jumping_pngs.length; i++) {
        left = jumping_pngs[i][0];
        right = jumping_pngs[i][1];
        pngLeft = new Image();
        pngRight = new Image();
        pngLeft.src = left;
        pngRight.src = right;
        IMAGES.jumping.left.push(pngLeft);
        IMAGES.jumping.right.push(pngRight);
    }
    var jetPack_pngs = [];
    for (i = 0; i < 10; i++) {
        jetPack_pngs.push('images/explosion/' + i + '.png');
    }
    for (i = 0; i < jetPack_pngs.length; i++) {
        var jp = new Image();
        jp.src = jetPack_pngs[i];
        IMAGES.jetPack.push(jp);
    }
    var platform_pngs = [];
    for (i = 0; i < 14; i++) {
        platform_pngs.push('images/platform/' + i + '.png');
    }
    for (i = 0; i < platform_pngs.length; i++) {
        var pp = new Image();
        pp.src = platform_pngs[i];
        IMAGES.platform.push(pp);
    }
    var coin_pngs = [];
    for (i = 0; i < 6; i++) {
        coin_pngs.push('images/coin/' + i + '.png');
    }
    for (i = 0; i < coin_pngs.length; i++) {
        var c = new Image();
        c.src = coin_pngs[i];
        IMAGES.coin.push(c);
    }
    var tank = new Image();
    tank.src = 'images/fuel-tank.png';
    IMAGES.fuelTank = tank;

    var asteroid = new Image();
    asteroid.src = 'images/asteroid.png';
    IMAGES.asteroid = asteroid;

    var starfield = new Image();
    starfield.src = 'images/starfield.png';
    IMAGES.starfield = starfield;
}

function init(numoflives) {
    ctx = $('#canvas')[0].getContext("2d");
    WIDTH = $('#canvas').width();
    HEIGHT = $('#canvas').height();
    C = {
        GAMEOVER_TEXT: ['Game', 'Over'],
        READY_TEXT: ['Ready?', ''],
        GO_TEXT: ['', 'GO!!'],
        MIN_PLATFORM_HEIGHT: 80,
        MAX_PLATFORM_HEIGHT: 320,
        MIN_ASTEROID_R: 10,
        MAX_ASTEROID_R: 25,
        ASTEROID_CUSHION: 1.3,
        LEFT: false,
        RIGHT: true,
        POSITION_SPACE: 20,
        PLATFORM_W: 5,
        FUEL_W: 20,
        FUEL_H: 40,
        FUEL_FREQUENCY: 400,
        XLIFE_FREQUENCY: 800,
        COIN_FREQUENCY: 80,
        COIN_R: 25,
        MAX_FUEL: 30,
        MAX_LIVES: 5,
        JETPACK_R: 20,
        INITIAL_JUMP: 5,
        JUMP_RANGE: 16,
        FALLING_IMAGE_SWITCH: 0.1,
        JETPACK_TIME: 0.25,
    };
    
    Game = {
        asteroids: [],
        platforms: [],
        fuelTanks: [],
        xLives: [],
        coins: [],
        hasWalls: false,
        walls: [],
        text: C.READY_TEXT,
        speed: 3,
        asteroidFrequency: 120,  // Less means more
        platformFrequency: 70,
        score: 0,
        jumpSpeed: 3,
        driftSpeed: 0.1,
        holdGo: 100,
    };

    Player = {
        direction: C.LEFT,
        jumping: false,
        usingJetPack: false,
        jetPackIndex: 0,
        xVel: 0,
        lives: numoflives,
        driftSpeed: Game.driftSpeed,
        jetPackSpeed: 0.8,
        jetPackFuel: 15,
        switchPNG: 0,
        forwardPNG: true,
        currentPNG: 0,
        w: 20,
        h: 40,
        x: WIDTH / 2,
        y: HEIGHT / 8,

        collision: function(platform) {
            if (this.xVel + this.driftSpeed < 0) {
                this.leftCollision(platform);
            } else if (this.xVel + this.driftSpeed > 0) {
                this.rightCollision(platform);
            }
        },
        leftCollision: function(platform) {
            if (platform){
                this.x = platform.x + platform.w + 1;
                if (Math.abs(this.xVel) > 0) {
                    this.driftSpeed = Game.driftSpeed * 4;
                } else {
                    this.driftSpeed = Game.driftSpeed;
                }
            } else {
                this.x = 0;
            }
            this.jumping = false;
            this.xVel = 0;
        },
        rightCollision: function(platform) {
            if (platform){
                this.x = platform.x - this.w - 1;
                if (Math.abs(this.xVel) > 0) {
                    this.driftSpeed = -Game.driftSpeed * 4;
                } else {
                    this.driftSpeed = -Game.driftSpeed;
                }
            } else {
                this.x = WIDTH - this.w;
            }
            this.xVel = 0;
            this.jumping = false;
        },
        update: function() {
            this.x += this.xVel + this.driftSpeed;
            if (this.x < -this.w) {
                this.x = WIDTH;
                // this.leftCollision();
            } else if (this.x > WIDTH){
                this.x = -this.w;
                // this.rightCollision();
            }
            // Draw.rect(this.x, this.y, this.w, this.h);
            var png;
            if (this.jumping === true) {
                if (this.switchPNG < IMAGES.jumping.right.length - 1) {
                    this.switchPNG += 1;
                }
                if (this.direction === C.RIGHT)
                    png = IMAGES.jumping.right[Math.floor(this.switchPNG)];
                else if (this.direction === C.LEFT)
                    png = IMAGES.jumping.left[Math.floor(this.switchPNG)];

            } else {
                if (this.switchPNG >= IMAGES.falling.right.length - 1) {
                    this.forwardPNG = false;
                } else if (this.switchPNG <= C.FALLING_IMAGE_SWITCH) {
                    this.forwardPNG = true;
                }
                if (this.forwardPNG === true) {
                    this.switchPNG += C.FALLING_IMAGE_SWITCH;
                } else {
                    this.switchPNG -= C.FALLING_IMAGE_SWITCH;
                }
                if (this.direction === C.RIGHT)
                    png = IMAGES.falling.right[Math.floor(this.switchPNG)];
                else if (this.direction === C.LEFT)
                    png = IMAGES.falling.left[Math.floor(this.switchPNG)];
            }
            ctx.drawImage(png, this.x, this.y, this.w * 1.5, this.h);
            if (this.usingJetPack) {
                png = IMAGES.jetPack[Math.floor(this.jetPackIndex)];
                if (this.direction === C.RIGHT) {
                    ctx.drawImage(png, this.x - C.JETPACK_R, this.y + this.h / 2, 
                        C.JETPACK_R, C.JETPACK_R);
                }
                else if (this.direction === C.LEFT) {
                    ctx.drawImage(png, this.x + this.w * 1.5, this.y + this.h / 2, 
                        C.JETPACK_R, C.JETPACK_R);
                }
                this.jetPackIndex += C.JETPACK_TIME;
                if (this.jetPackIndex == IMAGES.jetPack.length){
                    this.usingJetPack = false;
                    this.jetPackIndex = 0;
                }
            }
        },
    };    
    // return setInterval(GameLoop, 10);
}

function Asteroid(x, r) {
    this.x = x;
    this.y = HEIGHT + r;
    this.h = r * 2;
    this.w = r * 2;
    this.r = r;
    this.hitPlayer = false;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectRect(Player, this)){
            this.hitPlayer = true;
        } 
        
        var c = this.r * C.ASTEROID_CUSHION;
        // Circular Collision
        // ctx.drawImage(IMAGES.asteroid, this.x - this.r - c, this.y - this.r - c, this.r * 2 + c * 2, this.r * 2 + c * 2);
        // Draw.circle(this.x, this.y, this.r, this.hitPlayer);

        // Rectangular Collision
        ctx.drawImage(IMAGES.asteroid, this.x - c, this.y - c, this.w + c * 2, this.h + c * 2);
        // Draw.rect(this.x, this.y, this.w, this.h, this.hitPlayer);
    };
}

function Platform(x, height, image, walls) {
    this.x = x;
    this.y = HEIGHT;
    this.w = C.PLATFORM_W;
    this.h = height;
    this.wall = walls;
    this.image = IMAGES.platform[image];
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectRect(Player, this))
            Player.collision(this);
        // Draw.rect(this.x, this.y, this.w, this.h);
        ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
    };
}

function jetFuel(x) {
    this.x = x;
    this.y = HEIGHT;
    this.w = C.FUEL_W;
    this.h = C.FUEL_H;
    this.collected = false;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectRect(Player, this))
            this.collected = true;
        // Draw.rect(this.x, this.y, this.w, this.h, this.collected);
        ctx.drawImage(IMAGES.fuelTank, this.x, this.y, this.w, this.h);
    };
}

function xLife(x) {
    this.x = x;
    this.y = HEIGHT;
    this.w = Player.w;
    this.h = Player.h;
    this.collected = false;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectRect(Player, this))
            this.collected = true;
        ctx.drawImage(IMAGES.falling.right[0], this.x, this.y, this.w * 1.5, this.h);
    };
}

function Coin(x) {
    this.x = x;
    this.y = HEIGHT;
    this.r = C.COIN_R;
    this.spinSpeed = 0.1;
    this.index = 0;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectCircle(Player, this)) {
            this.collected = true;
        }
        ctx.drawImage(IMAGES.coin[Math.floor(this.index)], this.x, this.y, this.r, this.r);
        this.index += this.spinSpeed;
        if (this.index > IMAGES.coin.length - 1) {
            this.index = 0;
        }
    };
}

function makeWall() {
    var wallHeight = 100;
    var left = new Platform(-C.PLATFORM_W, wallHeight, true);
    var right = new Platform(WIDTH, wallHeight, true);
    Game.walls.push(left);
    Game.walls.push(right);
    Game.platforms.push(left);
    Game.platforms.push(right);
}

function Jump() {
    if (Player.lives >= 0) {
        Player.switchPNG = 0;
        var touchingLeft = false;
        var touchingRight = false;
        for (var i = 0; i < Game.platforms.length; i++) {
            Player.x -= C.JUMP_RANGE;
            if (Collision.rectRect(Game.platforms[i], Player)) {
                touchingLeft = true;
            }
            Player.x += C.JUMP_RANGE * 2;
            if (Collision.rectRect(Game.platforms[i], Player)) {
                touchingRight = true;
            }
            Player.x -= C.JUMP_RANGE;
        }

        // if ((touchingLeft && touchingRight) || (!touchingLeft && !touchingRight))
        //     return;

        if (touchingLeft === true){
            Player.x += C.INITIAL_JUMP;
            Player.xVel = Game.jumpSpeed;
            Player.direction = C.RIGHT;
            Player.jumping = true;
        } else if (touchingRight === true) {
            Player.x -= C.INITIAL_JUMP;
            Player.xVel = -Game.jumpSpeed;
            Player.direction = C.LEFT;
            Player.jumping = true;
        } else if (!Player.usingJetPack && Player.jetPackFuel > 0) {
            if (Player.direction === C.RIGHT) {
                Player.xVel += Player.jetPackSpeed;
            } else if (Player.direction === C.LEFT) {
                Player.xVel -= Player.jetPackSpeed;
            }
            Player.jetPackFuel -= 2;
            Player.usingJetPack = true;
        }
    } else {
        if (Game.text == C.GAMEOVER_TEXT) {
            Game.text = C.READY_TEXT;
        } else if (Game.text == C.READY_TEXT) {
            init(3);
            Game.text = C.GO_TEXT;
        }
    }
}

Draw = {
    lineWidth: 2,
    clear: function() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
    rect: function (x, y, w, h, fill) {
        if (fill) {
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.closePath(); 
            ctx.fill();
        } else {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeRect(x, y, w, h);
        }
        
    },
    circle: function(x, y, r, fill) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, true);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        else {
            ctx.lineWidth = this.lineWidth;
            ctx.stroke();
        }
    },
    text: function(x, y, t, font) {
        if (!font) {
            ctx.font = '32px Arial';
        } else {
            ctx.font = font;
        }
        ctx.fillStyle = 'white';
        ctx.fillText(t,x,y);
    },
    lives: function() {
        ctx.drawImage(IMAGES.coin[1], 5, 5, 30, 30);
        for (i = 1; i <= Player.lives; i++) {
            var x = WIDTH - i * 30;
            ctx.drawImage(IMAGES.falling.right[0], x, 5, Player.w * 1.5, Player.h);
        }
    },
    jetFuel: function() {
        ctx.drawImage(IMAGES.fuelTank, 100, -2, C.FUEL_W, C.FUEL_H);
        ctx.fillStyle = 'gold';
        this.rect(125, 5 + C.MAX_FUEL - Player.jetPackFuel, 10, Player.jetPackFuel, true);
    }
};

Random = {
    range: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    newPlatformReady: function() {
        return this.range(0, Game.platformFrequency) === 0;
    },
    platformX: function() {
        column = this.range(0, (Math.floor(WIDTH / C.POSITION_SPACE - 3))); // I have no idea why -4 works here
        return column * C.POSITION_SPACE  + ((column - 1) * C.PLATFORM_W + Draw.lineWidth);
    },
    platformHeight: function() {
        return this.range(C.MIN_PLATFORM_HEIGHT, C.MAX_PLATFORM_HEIGHT);
    },
    platformImage: function() {
        return this.range(0, IMAGES.platform.length - 1);
    },
    newAsteroidReady: function() {
        return this.range(0, Game.asteroidFrequency) === 0;
    },
    asteroidX: function() {
        return this.range(0, WIDTH);
    },
    asteroidR: function() {
        return this.range(C.MIN_ASTEROID_R, C.MAX_ASTEROID_R);
    },
    newTankReady: function() {
        return this.range(0, C.FUEL_FREQUENCY) === 0;
    },
    tankX: function() {
        return this.range(C.FUEL_W, WIDTH - C.FUEL_W);
    },
    newXLifeReady: function() {
        return this.range(0, C.XLIFE_FREQUENCY) === 0;
    },
    newCoinReady: function() {
        return this.range(0, C.COIN_FREQUENCY) === 0;
    }

};

Collision = {
    rectRect: function(rectA, rectB) {
        return !(rectB.x > rectA.x + rectA.w ||
            rectB.x + rectB.w < rectA.x || 
            rectB.y > rectA.y + rectA.h ||
            rectB.y + rectB.h < rectA.y
            );
    },
    rectCircle: function(rect, circle) {
        distX = Math.abs(circle.x - rect.x);
        distY = Math.abs(circle.y - rect.y);

        if (distX > (rect.w / 2 + circle.r) ||
            distY > (rect.h / 2 + circle.r))
            return false;
        if (distX <= (rect.width / 2) ||
            distY <= (rect.height / 2))
            return true;

        cornerDistSq = Math.pow((distX - rect.w / 2), 2) +
                        Math.pow((distY - rect.h / 2), 2);
        return (cornerDistSq <= Math.pow(circle.r, 2));
    },
    circleCircle: function(circleA, circleB) {

    },
};

function GameLoop() {
    var hitAsteroid = false;
    var extraLife = false;
    Draw.clear();
    ctx.drawImage(IMAGES.starfield, 0, 0, WIDTH, HEIGHT);
    if (Player.lives >= 0){
        if (Random.newAsteroidReady()) {
            Game.asteroids.push(
                new Asteroid(
                    Random.asteroidX(), 
                    Random.asteroidR()
                    )
                );
        }
        if (Random.newPlatformReady()) {
        Game.platforms.push(
            new Platform(
                Random.platformX(), 
                Random.platformHeight(),
                Random.platformImage()
                )
            );
        }
        if (Random.newXLifeReady()) {
        Game.xLives.push(
            new xLife(Random.tankX())
            );
        }
        var coin;
        if (Random.newCoinReady()) {
            coin = Game.coins.push(
            new Coin(Random.tankX())
            );
        }
    }

    for (var i = 0; i < Game.asteroids.length; i++) {
        var asteroid = Game.asteroids[i];
        asteroid.update();
        if (asteroid.hitPlayer) {
            Player.lives--;
            hitAsteroid = true;
            if (Player.lives < 0) {
                Game.text = C.GAMEOVER_TEXT;
            }
        }
        if (asteroid.y < -asteroid.h || asteroid.hitPlayer) {
            Game.asteroids.splice(i, 1);
            Game.score += 1;
        }
        if (Random.newTankReady()) {
        Game.fuelTanks.push(
            new jetFuel(Random.tankX())
            );
        }
    }    
    
    for (i = 0; i < Game.platforms.length; i++) {
        var platform = Game.platforms[i];
        platform.update();
        if (platform.y < -platform.h) {
            Game.platforms.splice(i, 1);
        }
    }

    

    for (i = 0; i < Game.fuelTanks.length; i++) {
        var tank = Game.fuelTanks[i];
        tank.update();
        if (tank.collected) {
            Player.jetPackFuel += 5;
            if (Player.jetPackFuel > 30)
                Player.jetPackFuel = 30;
        }
        if (tank.y < -tank.h || tank.collected) {
            Game.fuelTanks.splice(i, 1);
        }
    }

    
    for (i = 0; i < Game.xLives.length; i++) {
        var life = Game.xLives[i];
        life.update();
        if (life.collected) {
            Player.lives++;
            if (Player.lives > 5)
                Player.lives = 5;
            extraLife = true;
        }
        if (life.y < -life.h || life.collected) {
            Game.xLives.splice(i, 1);
        }
    }
    
    for (i = 0; i < Game.coins.length; i++) {
        coin = Game.coins[i];
        coin.update();
        if (coin.collected) {
            Game.score += 5;
        }
        if (coin.y < -coin.r || coin.collected) {
            Game.coins.splice(i, 1);
        }
    }

    if (Game.hasWalls === true) {
        if (Game.walls.length < 1) {
            makeWall();
        } else {
            var firstWall = Game.walls[0];
            var lastWall = Game.walls[Game.walls.length - 1];
            if (lastWall.y + lastWall.h <= HEIGHT) {
                makeWall();
            }
            if (firstWall.y + firstWall.h < 0) {
                Game.walls.shift();
                Game.walls.shift();
            }
        }
        for (i = 0; i < Game.walls.length; i++) {
            var wall = Game.walls[i];
            // wall.update();
        }
    }
    Draw.lives();
    Draw.text(40, 31, Game.score);
    Draw.jetFuel();
    Player.update();
    if (hitAsteroid) {
        ctx.fillStyle = 'pink';
        Draw.rect(0, 0, WIDTH, HEIGHT, true);
    }
    if (extraLife) {
        ctx.fillStyle = 'lightblue';
        Draw.rect(0, 0, WIDTH, HEIGHT, true);
    }

    if (Game.text == C.GO_TEXT){
        if (Game.holdGo > 0) {
            Game.holdGo -= 1;
        } else {
            Game.text = ['', ''];
        }
    }    Draw.text(60, 200, Game.text[0], '60px Arial');
    Draw.text(80, 300, Game.text[1], '60px Arial');
    
    requestAnimationFrame(GameLoop);
}

init(-1);
GameLoop();


});