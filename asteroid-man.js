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

// Screen
WIDTH = 345;
HEIGHT =  500;
RATIO = WIDTH / HEIGHT;

// Text
GAMEOVER_TEXT = ['Game', 'Over'];
READY_TEXT = ['Ready?', ''];
GO_TEXT = ['', 'GO!!'];
BLANK_TEXT = ['', ''];

// Player
FALLING_IMAGE_SWITCH = 0.1;
PLAYER_W = 20;
PLAYER_H = 40;

// Item Sizes and Ratios
MIN_PLATFORM_HEIGHT = 80;
MAX_PLATFORM_HEIGHT = 320;
MIN_ASTEROID_R = 10;
MAX_ASTEROID_R = 25;
ASTEROID_CUSHION = 0.7;
ASTROID_ROTATION_SPEED = 5;
POSITION_SPACE = 20;
PLATFORM_W = 5;
FUEL_W = 20;
FUEL_H = 40;
COIN_R = 25;
COIN_SPIN = 0.1;
JETPACK_R = 20;

// Contant Terms
HIT_PLAYER = 'hit-player';
ASTEROID_PASSED = 'asteroid-passed';
COIN_COLLECTED = 'coin-collected';
LIFE_COLLECTED = 'life-collected';
FUEL_COLLECTED = 'fuel-collected';

LEFT = false;
RIGHT = true;


// Frequencies
FUEL_FREQUENCY = 400;
XLIFE_FREQUENCY = 800;
COIN_FREQUENCY = 80;
PLATFORM_FREQUENCY = 70;
ASTEROID_FREQUENCY = 120;

// Maximum Values
MAX_FUEL = 30;
MAX_LIVES = 5;

// GamePlay
INITIAL_JUMP = 5;
JUMP_RANGE = 16;
JETPACK_TIME = 0.25;
JETPACK_SPEED = 0.8;
JUMP_SPEED = 3;
DRIFT_SPEED = 0.1;
GAME_SPEED = 3;


var Images = {
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
    starfield: [],
    fuel: [],
    asteroid: [],

    load: function(destination, path, length) {
        for (var i = 0; i < length; i++) {
            var image = new Image();
            path_i = 'images/' + path + '/' + i + '.png';
            image.src = path_i;
            destination.push(image);
        }
    },

    init: function() {
        var destinations = [
            [Images.falling.left, 'falling-left', 15],
            [Images.falling.right, 'falling-right', 15],
            [Images.jumping.left, 'jumping-left', 9],
            [Images.jumping.right, 'jumping-right', 9],
            [Images.jetPack, 'jet-pack', 10],
            [Images.platform, 'platform', 14],
            [Images.coin, 'coin', 6],
            [Images.starfield, 'starfield', 1],
            [Images.fuel, 'fuel', 1],
            [Images.asteroid, 'asteroid', 1]
        ];
        for (var i = 0; i < destinations.length; i++) {
            var d = destinations[i];
            Images.load(d[0], d[1], d[2]);
        }
    }
};
Random = {
    range: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    bool: function(max) {
        return Random.range(0, max) === 0;
    },
    send: {
        coin:     function() { return Random.bool(COIN_FREQUENCY); },
        platform: function() { return Random.bool(PLATFORM_FREQUENCY); },
        asteroid: function() { return Random.bool(ASTEROID_FREQUENCY); },
        fuel:     function() { return Random.bool(FUEL_FREQUENCY); },
        life:     function() { return Random.bool(XLIFE_FREQUENCY); },
    },
    r: {
        platform: function() { return Random.range(MIN_PLATFORM_HEIGHT, MAX_PLATFORM_HEIGHT); },
        asteroid: function() { return Random.range(MIN_ASTEROID_R, MAX_ASTEROID_R); }
    },
    x: {
        platform: function() { 
            column = Random.range(1, (Math.floor(WIDTH / POSITION_SPACE - 4))); // I have no idea why -4 works here
            return column * POSITION_SPACE  + ((column - 1) * PLATFORM_W);
        },
        asteroid: function() { return Random.range(0, WIDTH); },
        coin: function() { return Random.range(0, WIDTH); },
        life: function() { return Random.range(0, WIDTH); },
        fuel: function() { return Random.range(FUEL_W, WIDTH - FUEL_W); }
    },
    image: {
        platform: function () { return Random.range(0, Images.platform.length - 1); }
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
};

Draw = {
    lineWidth: 2,
    init: function() {
        Draw.ctx = $("#canvas")[0].getContext('2d');
    },
    clear: function() {
        Draw.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
    image: function(image, x, y, w, h) { 
        Draw.ctx.drawImage(image, x, y, w, h); 
    },
    rotatedImage: function(image, x, y, w, h, degree) {
        Draw.ctx.save();
        Draw.ctx.translate(x + w/2, y + h/2);
        Draw.ctx.rotate(degree * Math.PI / 180);
        Draw.image(image, - (w/2), - (h/2), w, h);
        // Draw.image(image, - (w/2), - (h/2), w, h);
        Draw.ctx.restore();
    },
    rect: function (x, y, w, h, fill) {
        if (fill) {
            Draw.ctx.beginPath();
            Draw.ctx.rect(x, y, w, h);
            Draw.ctx.closePath(); 
            Draw.ctx.fill();
        } else {
            Draw.ctx.lineWidth = Draw.lineWidth;
            Draw.ctx.strokeRect(x, y, w, h);
        }  
    },
    circle: function(x, y, r, fill) {
        Draw.ctx.beginPath();
        Draw.ctx.arc(x, y, r, 0, Math.PI * 2, true);
        Draw.ctx.closePath();
        if (fill) {
            Draw.ctx.fill();
        }
        else {
            Draw.ctx.lineWidth = Draw.lineWidth;
            Draw.ctx.stroke();
        }
    },
    text: function(x, y, t, font) {
        if (!font) {
            Draw.ctx.font = '32px Arial';
        } else {
            Draw.ctx.font = font;
        }
        Draw.ctx.fillStyle = 'white';
        Draw.ctx.fillText(t,x,y);
    },
    score: function(score) {
        Draw.ctx.drawImage(Images.coin[0], 5, 5, 30, 30);
        Draw.text(40, 31, score);
    },
    remainingLives: function(lives) {
        for (i = 1; i <= lives; i++) {
            var x = WIDTH - i * 30;
            Draw.ctx.drawImage(Images.falling.right[0], x, 5, PLAYER_W * 1.5, PLAYER_H);
        }
    },
    remainingFuel: function(fuel) {
        Draw.ctx.drawImage(Images.fuel[0], 100, -2, FUEL_W, FUEL_H);
        Draw.ctx.fillStyle = 'gold';
        this.rect(125, 5 + MAX_FUEL - fuel, 10, fuel, true);
    }
};

Session = {
    scale: 1,
    offset: {
        top:0,
        left: 0
    },
    canvas: null,
    ctx: null,
    ua: null,
    android: null,
    ios: null,
    game: null,
    width: null,
    height: null,
    ratio: null,

    init: function() {
        Session.canvas = $("#canvas")[0];
        Session.ctx = Session.canvas.getContext("2d");
        Session.ua = navigator.userAgent.toLowerCase();
        Session.android = Session.ua.indexOf('android') > -1 ? true : false;
        Session.ios = (Session.ua.indexOf('iphone') > -1 || Session.ua.indexOf('ipad') > -1) ? true : false;

        // listen for clicks
        window.addEventListener('click', function(e) {
            e.preventDefault();
        }, false);
        // listen for touches
        window.addEventListener('touchstart', function(e) {
            e.preventDefault();
            Session.click();
        }, false);
        window.addEventListener('keydown', function (e) {
            if (e.keyCode == 32) {
                e.preventDefault();
                Session.click();
            }
        });
        window.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function(e) {
            e.preventDefault();
        }, false);
        Images.init();
        Draw.ctx = Session.ctx;
        Session.resize();
        Session.game = new Game();
        Session.game.text = READY_TEXT;
        Session.loop();
    },

    resize: function() {
        Session.height = window.innerHeight;
        Session.width = Session.height * RATIO;
        Session.ratio = HEIGHT / Session.height;
        if (Session.android || Session.ios) {
            document.body.style.height = (window.innerHeight + 100) + 'px';
        }
        window.scrollTo(0, 1);
        Session.canvas.style.width = Session.width + 'px';
        Session.canvas.style.height = Session.height + 'px';

        Session.scale = Session.width / Session.height;
        Session.offset.top = Session.canvas.offsetTop;
        Session.offset.left = Session.canvas.offsetLeft;

        window.setTimeout(function() {
                window.scrollTo(0,1);
        }, 1);
    },
    loop: function() {
        Session.game.loop();
        requestAnimationFrame(Session.loop);
    },

    click: function() {
        if (Session.game.running === true) {
            Session.game.player.jump();
        }
        else {
            if (Session.game.text == GAMEOVER_TEXT) {
                Session.game = new Game();
                Session.game.text = READY_TEXT;
            } else if (Session.game.text == READY_TEXT) {
                Session.game.running = true;
                Session.game.text = GO_TEXT;
            }
        }
    }
};    

function Game() {
    this.player = new Player();
    this.running = false;
    this.asteroids = [];
    this.platforms = [];
    this.fuel = [];
    this.lives = [];
    this.coins = [];
    this.allObjects = [this.platforms, 
        this.fuel, this.lives, this.coins, this.asteroids];
    this.text = GO_TEXT;
    this.holdGo = 100;
    this.events = [];

    this.updateObjects = function() {
        for (var i = 0; i < this.allObjects.length; i++) {
            var group = this.allObjects[i];
            for (var j = 0; j < group.length; j++) {
                var object = group[j];
                object.update();
                if (object.destroy === true) {
                    if (object.arg) {
                        this.events.push(object.arg);
                    }
                    group.splice(j, 1);
                }
            }
        }
    };

    this.drawObjects = function() {
        for (var i = 0; i < this.allObjects.length; i++) {
            var group = this.allObjects[i];
            for (var j = 0; j < group.length; j++) {
                var object = group[j];
                object.draw();
            }
        }
    }

    this.sendObjects = function() {
        if (Random.send.asteroid()) {
            var asteroid = new Sprite();
            asteroid.asteroid(Random.x.asteroid(), Random.r.asteroid());
            this.asteroids.push(asteroid);
        }
        if (Random.send.coin()) {
            var coin = new Sprite();
            coin.coin(Random.x.coin());
            this.coins.push(coin);
        }
        if (Random.send.fuel()) {
            var fuel = new Sprite();
            fuel.fuel(Random.x.fuel());
            this.fuel.push(fuel);
        }
        if (Random.send.life()) {
            var life = new Sprite();
            life.life(Random.x.life());
            this.lives.push(life);
        }
        if (Random.send.platform()) {
            var platform = new Sprite();
            platform.platform(Random.x.platform(), Random.r.platform(), Random.image.platform());
            this.platforms.push(platform);
        }
    };

    this.holdGoFunction = function() {
        if (this.text == GO_TEXT){
            if (this.holdGo > 0) {
                this.holdGo -= 1;
            } else {
                this.text = BLANK_TEXT;
            }
        }  
    };

    this.gameOver = function() {
        this.text = GAMEOVER_TEXT;
        this.running = false;
    }

    this.processEvents = function() {
        for (var i = 0; i < this.events.length; i++) {
            var event = this.events[i];
            if (event == HIT_PLAYER) {
                this.player.lives -= 1;
                Draw.ctx.fillStyle = 'pink';
                Draw.rect(0, 0, WIDTH, HEIGHT, true);
            } else if (event == LIFE_COLLECTED) {
                this.player.lives += 1;
                if (this.player.lives > 5) {
                    this.player.lives = 5;
                }
                Draw.ctx.fillStyle = 'lightblue';
                Draw.rect(0, 0, WIDTH, HEIGHT, true);
            } else if (event == COIN_COLLECTED) {
                this.player.score += 5;
            } else if (event == ASTEROID_PASSED) {
                this.player.score += 1;
            } else if (event == FUEL_COLLECTED) {
                this.player.fuel += 5;
                if (this.player.fuel > 30) {
                    this.player.fuel = 30;
                }
            }
        }
        this.events = [];
    };

    this.loop = function() {
        Draw.clear();
        Draw.image(Images.starfield[0], 0, 0, WIDTH, HEIGHT);
        if (this.running === true) {
            this.sendObjects();
        }
        this.updateObjects();
        this.player.update();
        this.drawObjects();
        this.player.draw();
        this.processEvents();
        if (this.player.lives < 0) {
            this.gameOver();
        }

        this.holdGoFunction();
        Draw.text(60, 200, this.text[0], '60px Arial');
        Draw.text(80, 300, this.text[1], '60px Arial');
        Draw.score(this.player.score);
        Draw.remainingFuel(this.player.fuel);
        Draw.remainingLives(this.player.lives);
    };
}

function Player() {
    // Motion
    this.direction = LEFT;
    this.jumping =  false;
    this.xVel = 0;
    this.driftSpeed = DRIFT_SPEED;
    
    // Status
    this.lives = 3;
    this.fuel = 15;
    this.score = 0;

    // Images
    this.imageI = 0;
    this.imageD = true;
    this.jetPackI = -1;
    
    // Position
    this.x = WIDTH / 2;
    this.y = HEIGHT / 8;
    this.w = PLAYER_W;
    this.h = PLAYER_H;

    this.collision = function(platform) {
        if (this.xVel + this.driftSpeed < 0) {
                this.leftCollision(platform);
        } else if (this.xVel + this.driftSpeed > 0) {
            this.rightCollision(platform);
        }   
        this.jumping = false;
        this.xVel = 0;
    };
    this.leftCollision = function(platform) {   
        this.x = platform.x + platform.w + 1;
        if (Math.abs(this.xVel) > 0) {
            this.driftSpeed = DRIFT_SPEED * 4;
        } else {
            this.driftSpeed = DRIFT_SPEED;
        }
    };
    this.rightCollision = function(platform) {        
        this.x = platform.x - this.w - 1;
        if (Math.abs(this.xVel) > 0) {
            this.driftSpeed = -DRIFT_SPEED * 4;
        } else {
            this.driftSpeed = -DRIFT_SPEED;
        }
    };
    this.jump = function() {
        this.imageI = 0;
        var left = false;
        var right = false;
        var platforms = Session.game.platforms;
        for (var i = 0; i < platforms.length; i++) {
            var platform = platforms[i];
            this.x -= JUMP_RANGE;
            if (Collision.rectRect(platform, this)) {
                left = true;
            }
            this.x += JUMP_RANGE * 2;
            if (Collision.rectRect(platform, this)) {
                right = true;
            }
            this.x -= JUMP_RANGE;
        }

        if (left === true){
            this.x += INITIAL_JUMP;
            this.xVel = JUMP_SPEED;
            this.direction = RIGHT;
            this.jumping = true;
        } else if (right === true) {
            this.x -= INITIAL_JUMP;
            this.xVel = -JUMP_SPEED;
            this.direction = LEFT;
            this.jumping = true;
        } else if (this.jetPackI < 0 && this.fuel > 0) {
            if (this.direction === RIGHT) {
                this.xVel += JETPACK_SPEED;
            } else if (this.direction === LEFT) {
                this.xVel -= JETPACK_SPEED;
            }
            this.fuel -= 2;
            this.jetPackI = 0;
        }
    };
    this.draw = function() {
        var img;
        if (this.jumping === true) {
            if (this.imageI < Images.jumping.right.length - 1) {
                this.imageI += 1;
            }
            if (this.direction === RIGHT)
                img = Images.jumping.right[Math.floor(this.imageI)];
            else if (this.direction === LEFT)
                img = Images.jumping.left[Math.floor(this.imageI)];
        } else {
            if (this.imageI >= Images.falling.right.length - 1) {
                this.imageD = false;
            } else if (this.imageI <= FALLING_IMAGE_SWITCH) {
                this.imageD = true;
            }
            if (this.imageD === true) {
                this.imageI += FALLING_IMAGE_SWITCH;
            } else {
                this.imageI -= FALLING_IMAGE_SWITCH;
            }
            if (this.direction === RIGHT)
                img = Images.falling.right[Math.floor(this.imageI)];
            else if (this.direction === LEFT)
                img = Images.falling.left[Math.floor(this.imageI)];
        }
        Draw.image(img, this.x, this.y, this.w * 1.5, this.h);
        if (this.jetPackI >= 0) {
            var jet = Images.jetPack[Math.floor(this.jetPackI)];
            if (this.direction === RIGHT) {
                Draw.image(jet, this.x - JETPACK_R, this.y + this.h / 2,
                    JETPACK_R, JETPACK_R);
            }
            else if (this.direction === LEFT) {
                Draw.image(jet, this.x + this.w * 1.5, this.y + this.h / 2, 
                    JETPACK_R, JETPACK_R);
            }
        }
    };
    this.update = function() {
        this.x += this.xVel + this.driftSpeed;
        if (this.x < -this.w) {
                this.x = WIDTH;
        } else if (this.x > WIDTH) {
            this.x = -this.w;
        }
        if (this.jetPackI >= 0) {
            this.jetPackI += JETPACK_TIME;
            if (this.jetPackI >= Images.jetPack.length) {
                this.jetPackI = -1;
            }
        }
    };
}

function Sprite() {
    this.player = Session.game.player;
    this.arg = [];
    this.type = '';
    this.makeObject = function(x, y, args) {
        this.x = x;
        this.y = y;
        this.args = args;
    };
    this.makeRect = function(x, y, w, h, destroy, args) {
        this.makeObject(x, y, args);
        this.w = w;
        this.h = h;
        this.update = function() {
            this.y -= GAME_SPEED;
            if (Collision.rectRect(this.player, this)) {
                this.destroy = destroy;
                this.arg = this.args[0];
                if (this.movePlayer === true) {
                    this.player.collision(this);
                }
            }
            if (this.y < -this.h) {
                this.destroy = true;
                this.arg = this.args[1];
            }
        };
    };
    this.makeCircle = function(x, y, r, destroy, args) {
        this.makeObject(x, y, args);
        this.r = r;
        this.update = function() {
            this.y -= GAME_SPEED;
            if (Collision.rectCircle(this.player, this)) {
                this.destroy = destroy;
                this.arg = this.args[0];
            }
            if (this.y < -this.r) {
                this.destroy = true;
            }
        };
    };
    this.asteroid = function(x, w) {
        this.type = 'Asteroid';
        this.angle = Random.range(0, 300);
        this.spinSpeed = ASTROID_ROTATION_SPEED / Random.range(1, 10);
        this.makeRect(x, HEIGHT + w, w, w, true, [HIT_PLAYER, ASTEROID_PASSED]);
        this.draw = function() {
            var c = this.w * ASTEROID_CUSHION;
            this.angle += this.spinSpeed;
            Draw.rotatedImage(Images.asteroid[0], this.x - c, this.y - c, 
                this.w + (c * 2), this.h + (c * 2), Math.floor(this.angle));
        };    
    };
    this.platform = function(x, h, imageI) {
        this.type = 'Platform';
        this.makeRect(x, HEIGHT, PLATFORM_W, h, false, []);
        this.movePlayer = true;
        this.draw = function() {
            Draw.image(Images.platform[imageI], this.x, this.y, this.w, this.h);
        };
    };
    this.fuel = function(x) {
        this.type = 'Fuel';
        this.makeRect(x, HEIGHT, FUEL_W, FUEL_H, true, [FUEL_COLLECTED]);
        this.draw = function() {
            Draw.image(Images.fuel[0], this.x, this.y, this.w, this.h);
        };
    };
    this.life = function(x) {
        this.type = 'Life';
        this.makeRect(x, HEIGHT, PLAYER_W, PLAYER_H, true, [LIFE_COLLECTED]);
        this.draw = function() {
            Draw.image(Images.falling.right[0], this.x, this.y, this.w * 1.5, this.h);
        };
    };
    this.coin = function(x) {
        this.type = 'Coin';
        this.imageI = 0;
        this.makeCircle(x, HEIGHT, COIN_R, true, [COIN_COLLECTED], 0);
        this.draw = function() {
            this.imageI += COIN_SPIN;
            if (this.imageI >= Images.coin.length) {
                this.imageI = 0;
            }
            Draw.image(Images.coin[Math.floor(this.imageI)], this.x, this.y, this.r, this.r);
        };
    };
}

    Session.init();
});
    