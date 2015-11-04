$(document).ready(function() {
    
var x = 150;
var y = 150;
var dx = 2;
var dy = 4;
var WIDTH;
var HEIGHT;
var ctx;
var newSpikeTimer = 200;
var spikeSide = true;

$(document).on('keydown', function (event) {
    if (event.keyCode == 32) {
        event.preventDefault();
        Jump();
    }
});

function init() {
    ctx = $('#canvas')[0].getContext("2d");
    WIDTH = $('#canvas').width();
    HEIGHT = $('#canvas').height();
    C = {
        MIN_PLATFORM_HEIGHT: 20,
        MAX_PLATFORM_HEIGHT: 120,
        MIN_SPIKE_R: 10,
        MAX_SPIKE_R: 30,
        LEFT: false,
        RIGHT: true,
        POSITION_SPACE: 20,
        PLATFORM_W: 5,
        INITIAL_JUMP: 5,
        JUMP_RANGE: 16,
    };
    
    Game = {
        spikes: [],
        platforms: [],
        hasWalls: false,
        walls: [],
        speed: 3,
        spikeFrequency: 50,  // Less means more
        platformFrequency: 18,
        score: 0,
        jumpSpeed: 6,
        driftSpeed: .1,
    };

    Player = {
        side: C.LEFT,
        xVel: 0,
        driftSpeed: Game.driftSpeed,
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
                    this.driftSpeed = Game.driftSpeed * 4
                } else {
                    this.driftSpeed = Game.driftSpeed;
                }
            } else {
                this.x = 0;
            }
            this.side = C.LEFT;
            this.xVel = 0;
        },
        rightCollision: function(platform) {
            if (platform){
                this.x = platform.x - this.w - 1;
                if (Math.abs(this.xVel) > 0) {
                    this.driftSpeed = -Game.driftSpeed * 4
                } else {
                    this.driftSpeed = -Game.driftSpeed;
                }
            } else {
                this.x = WIDTH - this.w;
            }
            this.side = C.RIGHT;
            this.xVel = 0;
        },
        update: function() {
            this.x += this.xVel + this.driftSpeed;
            if (this.x < -this.w) {
                this.x = WIDTH;
                // this.leftCollision();
            }else if (this.x > WIDTH){
                this.x = -this.w;
                // this.rightCollision();
            }
            Draw.rect(this.x, this.y, this.w, this.h);
        },
    };
    return setInterval(GameLoop, 10);
}

function Spike(x, r) {
    this.x = x;
    this.y = HEIGHT + r;
    this.r = r;
    this.hitPlayer = false;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectCircle(Player, this)){
            this.hitPlayer = true;
        } 
        Draw.circle(this.x, this.y, this.r, this.hitPlayer);
    };
}

function Platform(x, height, walls) {
    this.x = x;
    this.y = HEIGHT;
    this.w = C.PLATFORM_W;
    this.h = height;
    this.wall = walls;
    this.update = function() {
        this.y -= Game.speed;
        if (Collision.rectRect(Player, this))
            Player.collision(this);
        Draw.rect(this.x, this.y, this.w, this.h);
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
    if (Player.xVel === 0) {
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
            }
        else if (touchingRight === true) {
            Player.x -= C.INITIAL_JUMP;
            Player.xVel = -Game.jumpSpeed;
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
    text: function(x, y, t) {
        ctx.font = "30px Arial";
        ctx.fillText(t,x,y);
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
    newSpikeReady: function() {
        return this.range(0, Game.spikeFrequency) === 0;
    },
    spikeX: function() {
        return this.range(0, WIDTH);
    },
    spikeR: function() {
        return this.range(C.MIN_SPIKE_R, C.MAX_SPIKE_R);
    },
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
    Draw.clear();
    if (Random.newSpikeReady()) {
        Game.spikes.push(
            new Spike(
                Random.spikeX(), 
                Random.spikeR()
                )
            );
    }

    for (var i = 0; i < Game.spikes.length; i++) {
        var spike = Game.spikes[i];
        spike.update();
        if (spike.y < -spike.r) {
            Game.spikes.splice(i, 1);
            Game.score += 1;
            console.log(Game.score);
        }
    }

    if (Random.newPlatformReady()) {
        Game.platforms.push(
            new Platform(
                Random.platformX(), 
                Random.platformHeight()
                )
            );
    }
    
    for (i = 0; i < Game.platforms.length; i++) {
        var platform = Game.platforms[i];
        platform.update();
        if (platform.y < -platform.h) {
            Game.platforms.splice(i, 1);
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
    Draw.text(10, 30, Game.score);
    Player.update();

}

init();

});