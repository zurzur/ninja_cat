
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
let requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
canvas.width = 1000;
canvas.height = 575;
document.body.appendChild(canvas);

// The main game loop
let lastTime;
function main() {
    let now = Date.now();
    let dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get(
        'http://img07.deviantart.net/b8b6/i/2014/300/7/5/dojo_background_for_a_e_card_i_m_working_on_by_cello8080-d84bevi.jpg'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });


    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';

    //reset();
    lastTime = Date.now();
    main();
}

resources.load([
	'img/running_cat.png',
    'img/sprites.png',
    //'http://pre11.deviantart.net/8ace/th/pre/i/2012/089/5/e/free_japanese_background_by_sweetlittlevampire-d4ufrxu.png',
    'http://img07.deviantart.net/b8b6/i/2014/300/7/5/dojo_background_for_a_e_card_i_m_working_on_by_cello8080-d84bevi.jpg',
]);
resources.onReady(init);

// Game state
let player = {
    pos: [0, 0],
    sprite: new Sprite('img/running_cat.png', [0, 0], [166, 130], 1, [4], 'horisontal'),
    lifes: 9,

    //sprite: new Sprite('img/running_cat.png', [0, 0], [83, 65], 1, [3], 'horisontal'),
    //sprite: new Sprite('img/running_cat.png', [0, 0], [83, 65], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal')
    //ninja is running
    //sprite: new Sprite('img/running_cat.png', [0, 67], [82, 78], 12, [0, 1, 2, 3, 4, 5], 'horisontal')
    //ninja attack
    //sprite: new Sprite('img/running_cat.png', [0, 145], [105, 90], 12, [0, 1, 2, 3, 4], 'horisontal')
    //game over
    //sprite: new Sprite('img/running_cat.png', [0, 235], [120, 65], 6, [0, 1, 2, 3, 4], 'horisontal', 'once')
};

let ninjaRun = new Sprite('img/running_cat.png', [0, 134], [164, 156], 12, [0, 1, 2, 3, 4, 5], 'horisontal');
let ninjaAttack = new Sprite('img/running_cat.png', [0, 300], [210, 172], 12, [0, 1, 2, 3, 4], 'horisontal');

let bullets = [];
let enemies = [];
let explosions = [];
let sushi  = [];

let lastFire = Date.now();
let gameTime = 0;
let superpowerTime = 25;
let powerLoading;
let isGameOver;
let terrainPattern;

let scoreOfWin = 10000;
let scoreOfLose = -50000;
let score = 0;
let scoreEl = document.getElementById('score');

// Speed in pixels per second
let playerSpeed = 300;
let bulletSpeed = 400;
let enemySpeed = 200;

// Update game objects
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    if(Math.random() < 1 - Math.pow(.999, gameTime)) {
        enemies.push({
            pos: [canvas.width,
                  Math.random() * (canvas.height - 39)],
            sprite: new Sprite('img/running_cat.png', [0, 610], [64, 44], 12, [0, 1, 2, 3, 4, 5, 4, 3, 2, 1], 'horisontal')      
            //sprite: new Sprite('img/running_cat.png', [0, 305], [32, 22], 12, [0, 1, 2, 3, 4, 5, 4, 3, 2, 1], 'horisontal')
        });
    }

    checkCollisions();

    if (gameTime < superpowerTime) powerLoading = Math.ceil(gameTime/superpowerTime * 100);
    else powerLoading = 100;

    scoreEl.innerHTML = `SCORE: ${score} from ${scoreOfWin} 
                        <br>NinjaCat LIVES: ${player.lifes}
                        <br>SUPERPOWER: ${powerLoading}%`;
};

function handleInput(dt) {
    if (input.isDown('E')) {
        player.sprite = new Sprite('img/running_cat.png', [0, 0], [166, 130], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal');
    }

    if (input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
        
    }

    if (input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= 2 * playerSpeed * dt;
        player.pos[0] += 2 * playerSpeed * dt;
        //player.sprite = new Sprite('img/running_cat.png', [0, 0], [166, 130], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal');
    }

    if (input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
        //player.sprite = new Sprite('img/running_cat.png', [0, 0], [166, 130], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal');
    }

    if (input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
        //player.sprite = new Sprite('img/running_cat.png', [0, 0], [166, 130], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal');
    }

    if (input.isDown('SPACE')) {
                player.sprite = ninjaAttack;
        let promise = new Promise((res) => {
    
             setTimeout(() => {
                res("result");
            }, 100);
    
         });
    
         promise
            .then(
                () => {
                player.sprite = ninjaRun;
                }
             );
    }

    if(input.isDown('f') &&
       !isGameOver &&
       Date.now() - lastFire > 100) {
        let x = player.pos[0] + player.sprite.size[0] / 2;
        let y = player.pos[1] + player.sprite.size[1] / 2;

        player.sprite = ninjaAttack;
        let promise = new Promise((res) => {
             setTimeout(() => {
                res("result");
            }, 1000);
    
         });
    
         promise
            .then(
                () => {
                player.sprite = ninjaRun;
                }
             );

        bullets.push({ pos: [x, y],
                       dir: 'forward',
                       sprite: new Sprite('img/running_cat.png', [0, 695], [16,16], 12, [0, 1, 2, 3]) });
        /*bullets.push({ pos: [x, y],
                       dir: 'up',
                       sprite: new Sprite('img/running_cat.png', [0, 695], [16,16], [0, 1, 2, 3]) });
                       */

        lastFire = Date.now();
    }

    if (input.isDown('q') && gameTime > superpowerTime) {
        
        gameTime = 0;
        score -= 3000;
        player.sprite = ninjaAttack;

        for(let i=0; i < enemies.length; i++) {
            let pos = enemies[i].pos;
            explosions.push({
                    pos: pos,
                    //sprite: new Sprite('img/running_cat.png', [80, 660], [72, 45], 6, [0, 1, 2]), 
                    sprite: new Sprite('img/sprites.png',
                                      [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });
        }
        enemies = [];
        sushi = [];


        let promise = new Promise((res) => {
             setTimeout(() => {
                res("result");
            }, 1000);
    
         });
    
         promise
            .then(
                () => {
                player.sprite = ninjaRun;
                }
             );

    }
}

function updateEntities(dt) {
    // Update the player sprite animation
    player.sprite.update(dt);

    // Update all the bullets
    for(let i=0; i<bullets.length; i++) {
        let bullet = bullets[i];

        switch(bullet.dir) {
        case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
        case 'down': bullet.pos[1] += bulletSpeed * dt; break;
        default:
            bullet.pos[0] += bulletSpeed * dt;
        }

        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update all the enemies
    for(let i=0; i<enemies.length; i++) {
        enemies[i].pos[0] -= enemySpeed * dt;
        enemies[i].sprite.update(dt);

        // Remove if offscreen
        if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
            enemies.splice(i, 1);
            i--;
        }
    }

    // Update all the explosions
    for(let i=0; i<explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if(explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions() {
    if (isGameOver===false) {
     checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(let i=0; i<enemies.length; i++) {
        let pos = enemies[i].pos;
        let size = enemies[i].sprite.size;

        for(let j=0; j<bullets.length; j++) {
            let pos2 = bullets[j].pos;
            let size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                //player.sprite = new Sprite('img/running_cat.png', [0, 470], [240, 130], 6, [0, 1, 2, 3, 4], 'horisontal', 'once');
                // Remove the enemy
                enemies.splice(i, 1);
                i--;

                // Add score
                score += 100;

                // Add an explosion
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/running_cat.png', [80, 660], [72, 45], 6, [0, 1, 2, 1, 0, 0, 1, 2, 1, 0, 0, 1, 2, 1, 0], null,  true), 
                    //sprite: new Sprite('img/sprites.png',
                    //                   [0, 117],
                    //                   [39, 39],
                    //                   16,
                    //                   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    //                   null,
                    //                   true)
                });

                // Remove the bullet and stop this iteration
                bullets.splice(j, 1);
                break;
            }
        }

        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
            
             //player.sprite = new Sprite('img/running_cat.png', [0, 145], [105, 90], 12, [0, 1, 2, 3, 4], 'horisontal');
            enemies.splice(i, 1);
            i--;

            // Add an explosion
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });

            if (!input.isDown('SPACE')) {
                player.lifes -= 1;
                  
            }

            score -= 500;

            // Add score
            
            //player.sprite = new Sprite('img/running_cat.png', [0, 0], [83, 65], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal')
        }
    }

    // Run collision detection for all sushies and bullets
    for(let g=0; g<sushi.length; g++) {
        let posSushi = sushi[g].pos;
        let sizeSushi = sushi[g].sprite.size;

        for(let h=0; h<bullets.length; h++) {
            let posBullets = bullets[h].pos;
            let sizeBullets = bullets[h].sprite.size;

            if(boxCollides(posSushi, sizeSushi, posBullets, sizeBullets)) {
                //player.sprite = new Sprite('img/running_cat.png', [0, 470], [240, 130], 6, [0, 1, 2, 3, 4], 'horisontal', 'once');
                // Remove the enemy
                sushi.splice(g, 1);
                g--;

                // Add score
                score -= 100;

                // Add an explosion
                explosions.push({
                    pos: posSushi,
                    //sprite: new Sprite('img/running_cat.png', [80, 660], [72, 45], 6, [0, 1, 2]), 
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });

                // Remove the bullet and stop this iteration
                bullets.splice(h, 1);
                break;
            }
        }

        if(boxCollides(posSushi, sizeSushi, player.pos, player.sprite.size)) {
            //player.lifes += 0.1;
             //player.sprite = new Sprite('img/running_cat.png', [0, 145], [105, 90], 12, [0, 1, 2, 3, 4], 'horisontal');
            sushi.splice(g, 1);
            g--;
            // Add an explosion
                explosions.push({
                    pos: posSushi,
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });

            // Add score
            score += 100;
            
            //player.sprite = new Sprite('img/running_cat.png', [0, 0], [83, 65], 12, [0, 1, 2, 3, 4, 5, 6, 7], 'horisontal')
        }
    }
    }
}

function checkPlayerBounds() {
    // Check bounds
    
        if(player.pos[0] < 0) {
            player.pos[0] = 0;
        }
        else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
            player.pos[0] = canvas.width - player.sprite.size[0];
        }

        if(player.pos[1] < 0) {
            player.pos[1] = 0;
        }
        else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
            player.pos[1] = canvas.height - player.sprite.size[1];
        }
    
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        if ((score < scoreOfWin) && player.lifes > 0 && score > scoreOfLose) {
        renderEntity(player);
        renderEntities(bullets);
        renderEntities(enemies);
        renderEntities(explosions);
        renderEntities(sushi);
        } else gameOver();
    }


};

function renderEntities(list) {
    for(let i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
     
        player.sprite = new Sprite('img/running_cat.png', [0, 470], [240, 130], 6, [0, 1, 2, 3, 4], 'horisontal', 'once');
        //player.sprite = new Sprite('img/running_cat.png', [0, 235], [120, 65], 6, [0, 1, 2, 3, 4], 'horisontal', 'once');
    
    let promise = new Promise((res) => {
      setTimeout(() => {
        res("result");
      }, 1000);
    });

    enemies = [];

    promise
      .then(
        () => {
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('game-over-overlay').style.display = 'block';
            document.getElementById('play-again').innerHTML = 'PLAY AGAIN';
            if (score >= scoreOfWin) document.getElementsByTagName('h1')[0].innerHTML = 'You won with score '+ score + '!';
            else document.getElementsByTagName('h1')[0].innerHTML = 'Game over!';
            isGameOver = true;
            //let gameOverCanvas = document.createElement("canvas");
            //let ctx = gameOverCanvas.getContext("2d");
            //gameOverCanvas.width = 210;
            //gameOverCanvas.height = 180;
            //let deadNinja = new Sprite('img/running_cat.png', [0, 300], [210, 180]);
            //document.getElementById('game-over').appendChild(1);
        }
      );

}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';

    isGameOver = false;
    gameTime = 0;
    score = 0;
    player.lifes = 9;
    
    bullets = [];
    enemies = [];
    sushi = [];
    player.pos = [50, 2 * canvas.height / 3];
    player.sprite = new Sprite('img/running_cat.png', [0, 0], [166, 130], 1, [4], 'horisontal');
};
