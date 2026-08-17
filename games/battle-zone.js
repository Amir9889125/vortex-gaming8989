const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const miniMap = document.getElementById("miniMap");
const miniCtx = miniMap.getContext("2d");

const healthBar = document.getElementById("healthBar");
const healthText = document.getElementById("healthText");
const ammoText = document.getElementById("ammo");
const reserveAmmoText = document.getElementById("reserveAmmo");
const playersAliveText = document.getElementById("playersAlive");
const zoneTimerText = document.getElementById("zoneTimer");
const message = document.getElementById("message");
const killFeed = document.getElementById("killFeed");

let W = 0;
let H = 0;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;

    miniMap.width = 190;
    miniMap.height = 190;
}

window.addEventListener("resize", resize);
resize();

/* =========================
   WORLD
========================= */

const WORLD = {
    width: 5000,
    height: 5000
};

const camera = {
    x: 0,
    y: 0
};

/* =========================
   INPUT
========================= */

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === "r") {
        reload();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

const mouse = {
    x: 0,
    y: 0,
    down: false
};

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mousedown", () => {
    mouse.down = true;
});

window.addEventListener("mouseup", () => {
    mouse.down = false;
});

/* =========================
   PLAYER
========================= */

const player = {
    x: WORLD.width / 2,
    y: WORLD.height / 2,

    radius: 20,

    speed: 3.6,

    health: 100,

    angle: 0,

    ammo: 30,
    reserveAmmo: 120,

    fireCooldown: 0,

    kills: 0
};

/* =========================
   CAMERA
========================= */

function updateCamera() {

    camera.x = player.x - W / 2;
    camera.y = player.y - H / 2;

    camera.x = Math.max(
        0,
        Math.min(camera.x, WORLD.width - W)
    );

    camera.y = Math.max(
        0,
        Math.min(camera.y, WORLD.height - H)
    );
}

/* =========================
   TERRAIN
========================= */

const trees = [];
const rocks = [];
const buildings = [];
const roads = [];
const bushes = [];
const crates = [];
const waterAreas = [];

/* deterministic random */

let seed = 12345;

function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

/* Water */

waterAreas.push({
    x: 3300,
    y: 500,
    width: 1200,
    height: 850
});

waterAreas.push({
    x: 200,
    y: 3400,
    width: 1100,
    height: 700
});

/* Roads */

roads.push({
    x: 0,
    y: 2450,
    width: WORLD.width,
    height: 150
});

roads.push({
    x: 2380,
    y: 0,
    width: 170,
    height: WORLD.height
});

roads.push({
    x: 900,
    y: 1200,
    width: 2500,
    height: 100
});

roads.push({
    x: 1300,
    y: 3500,
    width: 2600,
    height: 100
});

/* Trees */

for (let i = 0; i < 450; i++) {

    const x = random() * WORLD.width;
    const y = random() * WORLD.height;

    trees.push({
        x,
        y,
        size: 14 + random() * 14
    });
}

/* Bushes */

for (let i = 0; i < 250; i++) {

    bushes.push({
        x: random() * WORLD.width,
        y: random() * WORLD.height,
        size: 8 + random() * 10
    });
}

/* Rocks */

for (let i = 0; i < 180; i++) {

    rocks.push({
        x: random() * WORLD.width,
        y: random() * WORLD.height,
        size: 8 + random() * 12
    });
}

/* Buildings */

const buildingPositions = [
    [500, 500],
    [800, 650],
    [1150, 500],
    [1500, 650],

    [3300, 500],
    [3700, 700],
    [4100, 550],

    [500, 1800],
    [900, 1900],
    [1300, 1750],

    [3000, 1800],
    [3500, 2000],
    [4000, 1800],

    [500, 3000],
    [900, 3200],
    [1400, 3000],

    [2900, 3200],
    [3400, 3000],
    [3900, 3300]
];

buildingPositions.forEach(pos => {

    buildings.push({
        x: pos[0],
        y: pos[1],

        width: 180 + random() * 120,
        height: 130 + random() * 100
    });
});

/* Crates */

for (let i = 0; i < 100; i++) {

    crates.push({
        x: 200 + random() * 4600,
        y: 200 + random() * 4600
    });
}

/* =========================
   ENEMIES
========================= */

const enemies = [];

for (let i = 0; i < 24; i++) {

    let x;
    let y;

    do {
        x = 300 + random() * 4400;
        y = 300 + random() * 4400;
    } while (
        Math.hypot(
            x - player.x,
            y - player.y
        ) < 500
    );

    enemies.push({

        x,
        y,

        radius: 18,

        health: 100,

        angle: random() * Math.PI * 2,

        speed: 0.7 + random() * 0.7,

        moveTimer: random() * 120,

        shootTimer: 60 + random() * 180,

        alive: true
    });
}

/* =========================
   LOOT
========================= */

const loot = [];

for (let i = 0; i < 70; i++) {

    loot.push({

        x: 200 + random() * 4600,
        y: 200 + random() * 4600,

        type: random() > .5
            ? "ammo"
            : "medkit",

        collected: false
    });
}

/* =========================
   SAFE ZONE
========================= */

const zone = {

    x: WORLD.width / 2,
    y: WORLD.height / 2,

    radius: 2200,

    targetRadius: 2200,

    timer: 60
};

/* =========================
   BULLETS
========================= */

const bullets = [];

/* =========================
   PLAYER MOVEMENT
========================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;

    if (dx !== 0 || dy !== 0) {

        const length = Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed;
        player.y += dy * player.speed;
    }

    player.x = Math.max(
        player.radius,
        Math.min(
            WORLD.width - player.radius,
            player.x
        )
    );

    player.y = Math.max(
        player.radius,
        Math.min(
            WORLD.height - player.radius,
            player.y
        )
    );

    player.angle = Math.atan2(
        mouse.y - H / 2,
        mouse.x - W / 2
    );
}

/* =========================
   SHOOTING
========================= */

function shoot() {

    if (player.fireCooldown > 0) return;

    if (player.ammo <= 0) {

        reload();

        return;
    }

    player.ammo--;

    player.fireCooldown = 8;

    bullets.push({

        x: player.x,
        y: player.y,

        angle: player.angle,

        speed: 16,

        life: 70,

        owner: "player"
    });
}

/* =========================
   RELOAD
========================= */

let reloading = false;

function reload() {

    if (reloading) return;

    if (player.ammo >= 30) return;

    if (player.reserveAmmo <= 0) return;

    reloading = true;

    showMessage("RELOADING");

    setTimeout(() => {

        const needed = 30 - player.ammo;

        const amount = Math.min(
            needed,
            player.reserveAmmo
        );

        player.ammo += amount;
        player.reserveAmmo -= amount;

        reloading = false;

    }, 1000);
}

/* =========================
   BULLETS
========================= */

function updateBullets() {

    bullets.forEach((bullet, index) => {

        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;

        bullet.life--;

        if (bullet.life <= 0) {

            bullets.splice(index, 1);

            return;
        }

        if (bullet.owner === "player") {

            enemies.forEach(enemy => {

                if (!enemy.alive) return;

                const distance = Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );

                if (distance < enemy.radius + 5) {

                    enemy.health -= 35;

                    bullets.splice(index, 1);

                    if (enemy.health <= 0) {

                        enemy.alive = false;

                        player.kills++;

                        addKillFeed(
                            "VORTEX eliminated enemy"
                        );
                    }
                }
            });
        }
    });
}

/* =========================
   ENEMY AI
========================= */

function updateEnemies() {

    enemies.forEach(enemy => {

        if (!enemy.alive) return;

        const distance = Math.hypot(
            player.x - enemy.x,
            player.y - enemy.y
        );

        if (distance < 650) {

            enemy.angle = Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );

            enemy.x +=
                Math.cos(enemy.angle) *
                enemy.speed;

            enemy.y +=
                Math.sin(enemy.angle) *
                enemy.speed;

            enemy.shootTimer--;

            if (
                enemy.shootTimer <= 0 &&
                distance < 500
            ) {

                enemyShoot(enemy);

                enemy.shootTimer =
                    80 + random() * 100;
            }

        } else {

            enemy.moveTimer--;

            if (enemy.moveTimer <= 0) {

                enemy.angle =
                    random() * Math.PI * 2;

                enemy.moveTimer =
                    60 + random() * 160;
            }

            enemy.x +=
                Math.cos(enemy.angle) *
                enemy.speed;

            enemy.y +=
                Math.sin(enemy.angle) *
                enemy.speed;
        }

        enemy.x = Math.max(
            20,
            Math.min(WORLD.width - 20, enemy.x)
        );

        enemy.y = Math.max(
            20,
            Math.min(WORLD.height - 20, enemy.y)
        );
    });
}

/* =========================
   ENEMY SHOOT
========================= */

function enemyShoot(enemy) {

    bullets.push({

        x: enemy.x,
        y: enemy.y,

        angle: enemy.angle,

        speed: 9,

        life: 80,

        owner: "enemy"
    });
}

/* =========================
   LOOT
========================= */

function updateLoot() {

    loot.forEach(item => {

        if (item.collected) return;

        const distance = Math.hypot(
            player.x - item.x,
            player.y - item.y
        );

        if (distance < 35) {

            item.collected = true;

            if (item.type === "ammo") {

                player.reserveAmmo += 30;

                showMessage("+30 AMMO");

            } else {

                player.health =
                    Math.min(100, player.health + 30);

                showMessage("+30 HP");
            }
        }
    });
}

/* =========================
   SAFE ZONE
========================= */

function updateZone() {

    zone.timer -= 1 / 60;

    if (zone.timer <= 0) {

        zone.targetRadius =
            Math.max(
                500,
                zone.targetRadius - 350
            );

        zone.timer = 45;
    }

    zone.radius +=
        (zone.targetRadius - zone.radius) *
        0.002;

    const distance = Math.hypot(
        player.x - zone.x,
        player.y - zone.y
    );

    if (distance > zone.radius) {

        player.health -= 0.035;

        showDamage();

        if (player.health <= 0) {

            player.health = 0;

            gameOver();
        }
    }
}

/* =========================
   HUD
========================= */

function updateHUD() {

    healthBar.style.width =
        player.health + "%";

    healthText.textContent =
        Math.ceil(player.health);

    ammoText.textContent =
        player.ammo;

    reserveAmmoText.textContent =
        player.reserveAmmo;

    playersAliveText.textContent =
        enemies.filter(e => e.alive).length + 1;

    zoneTimerText.textContent =
        Math.ceil(zone.timer);
}

/* =========================
   DRAW WORLD
========================= */

function drawWorld() {

    ctx.fillStyle = "#526b43";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    drawGround();
    drawWater();
    drawRoads();
    drawBuildings();
    drawCrates();
    drawRocks();
    drawBushes();
    drawTrees();
    drawLoot();
    drawZone();
    drawBullets();
    drawEnemies();
    drawPlayer();

    ctx.restore();
}

/* =========================
   GROUND
========================= */

function drawGround() {

    ctx.fillStyle = "#536b43";

    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    /* grass texture */

    ctx.strokeStyle = "rgba(20,45,20,.15)";
    ctx.lineWidth = 1;

    for (
        let x = 0;
        x < WORLD.width;
        x += 45
    ) {

        for (
            let y = 0;
            y < WORLD.height;
            y += 45
        ) {

            ctx.beginPath();

            ctx.moveTo(x + 5, y + 10);
            ctx.lineTo(x + 8, y + 4);

            ctx.stroke();
        }
    }
}

/* =========================
   WATER
========================= */

function drawWater() {

    waterAreas.forEach(water => {

        ctx.fillStyle = "#3e7180";

        ctx.fillRect(
            water.x,
            water.y,
            water.width,
            water.height
        );

        ctx.strokeStyle =
            "rgba(180,230,240,.2)";

        for (
            let y = water.y + 20;
            y < water.y + water.height;
            y += 35
        ) {

            ctx.beginPath();

            ctx.moveTo(
                water.x + 20,
                y
            );

            ctx.lineTo(
                water.x + water.width - 20,
                y
            );

            ctx.stroke();
        }
    });
}

/* =========================
   ROADS
========================= */

function drawRoads() {

    roads.forEach(road => {

        ctx.fillStyle = "#5c5c55";

        ctx.fillRect(
            road.x,
            road.y,
            road.width,
            road.height
        );

        ctx.strokeStyle =
            "rgba(255,230,120,.45)";

        ctx.lineWidth = 4;

        if (road.width > road.height) {

            for (
                let x = road.x;
                x < road.x + road.width;
                x += 60
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    x,
                    road.y + road.height / 2
                );

                ctx.lineTo(
                    x + 30,
                    road.y + road.height / 2
                );

                ctx.stroke();
            }

        } else {

            for (
                let y = road.y;
                y < road.y + road.height;
                y += 60
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    road.x + road.width / 2,
                    y
                );

                ctx.lineTo(
                    road.x + road.width / 2,
                    y + 30
                );

                ctx.stroke();
            }
        }
    });
}

/* =========================
   BUILDINGS
========================= */

function drawBuildings() {

    buildings.forEach(building => {

        ctx.fillStyle = "#454841";

        ctx.fillRect(
            building.x,
            building.y,
            building.width,
            building.height
        );

        ctx.fillStyle = "#252824";

        ctx.fillRect(
            building.x - 5,
            building.y - 12,
            building.width + 10,
            15
        );

        /* windows */

        ctx.fillStyle = "#91a37e";

        for (
            let x = building.x + 25;
            x < building.x + building.width - 15;
            x += 42
        ) {

            for (
                let y = building.y + 25;
                y < building.y + building.height - 15;
                y += 40
            ) {

                ctx.fillRect(
                    x,
                    y,
                    16,
                    12
                );
            }
        }

        /* door */

        ctx.fillStyle = "#22231f";

        ctx.fillRect(
            building.x +
            building.width / 2 - 12,

            building.y +
            building.height - 35,

            24,
            35
        );
    });
}

/* =========================
   CRATES
========================= */

function drawCrates() {

    crates.forEach(crate => {

        if (
            crate.x < camera.x - 40 ||
            crate.x > camera.x + W + 40 ||
            crate.y < camera.y - 40 ||
            crate.y > camera.y + H + 40
        ) return;

        ctx.fillStyle = "#78562f";

        ctx.fillRect(
            crate.x - 12,
            crate.y - 12,
            24,
            24
        );

        ctx.strokeStyle = "#3f2c18";

        ctx.strokeRect(
            crate.x - 12,
            crate.y - 12,
            24,
            24
        );

        ctx.beginPath();

        ctx.moveTo(
            crate.x - 12,
            crate.y - 12
        );

        ctx.lineTo(
            crate.x + 12,
            crate.y + 12
        );

        ctx.moveTo(
            crate.x + 12,
            crate.y - 12
        );

        ctx.lineTo(
            crate.x - 12,
            crate.y + 12
        );

        ctx.stroke();
    });
}

/* =========================
   ROCKS
========================= */

function drawRocks() {

    rocks.forEach(rock => {

        if (
            rock.x < camera.x - 50 ||
            rock.x > camera.x + W + 50 ||
            rock.y < camera.y - 50 ||
            rock.y > camera.y + H + 50
        ) return;

        ctx.fillStyle = "#62665d";

        ctx.beginPath();

        ctx.arc(
            rock.x,
            rock.y,
            rock.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#7c8177";

        ctx.beginPath();

        ctx.arc(
            rock.x - rock.size * .3,
            rock.y - rock.size * .3,
            rock.size * .35,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

/* =========================
   BUSHES
========================= */

function drawBushes() {

    bushes.forEach(bush => {

        if (
            bush.x < camera.x - 40 ||
            bush.x > camera.x + W + 40 ||
            bush.y < camera.y - 40 ||
            bush.y > camera.y + H + 40
        ) return;

        ctx.fillStyle = "#294b2a";

        ctx.beginPath();

        ctx.arc(
            bush.x,
            bush.y,
            bush.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#386238";

        ctx.beginPath();

        ctx.arc(
            bush.x - 5,
            bush.y - 5,
            bush.size * .55,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

/* =========================
   TREES
========================= */

function drawTrees() {

    trees.forEach(tree => {

        if (
            tree.x < camera.x - 70 ||
            tree.x > camera.x + W + 70 ||
            tree.y < camera.y - 70 ||
            tree.y > camera.y + H + 70
        ) return;

        /* shadow */

        ctx.fillStyle = "rgba(0,0,0,.25)";

        ctx.beginPath();

        ctx.ellipse(
            tree.x,
            tree.y + 12,
            tree.size * .9,
            tree.size * .45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /* trunk */

        ctx.fillStyle = "#60472b";

        ctx.fillRect(
            tree.x - 5,
            tree.y,
            10,
            tree.size
        );

        /* crown */

        ctx.fillStyle = "#1d4d27";

        ctx.beginPath();

        ctx.arc(
            tree.x,
            tree.y - 10,
            tree.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#2f6735";

        ctx.beginPath();

        ctx.arc(
            tree.x - 7,
            tree.y - 15,
            tree.size * .55,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

/* =========================
   LOOT DRAW
========================= */

function drawLoot() {

    loot.forEach(item => {

        if (item.collected) return;

        ctx.fillStyle =
            item.type === "ammo"
                ? "#e1bb4d"
                : "#66c66b";

        ctx.fillRect(
            item.x - 8,
            item.y - 8,
            16,
            16
        );

        ctx.strokeStyle = "white";

        ctx.strokeRect(
            item.x - 8,
            item.y - 8,
            16,
            16
        );
    });
}

/* =========================
   ZONE DRAW
========================= */

function drawZone() {

    ctx.save();

    ctx.fillStyle =
        "rgba(80,110,180,.18)";

    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    ctx.globalCompositeOperation =
        "destination-out";

    ctx.beginPath();

    ctx.arc(
        zone.x,
        zone.y,
        zone.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalCompositeOperation =
        "source-over";

    ctx.strokeStyle =
        "rgba(100,180,255,.8)";

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.arc(
        zone.x,
        zone.y,
        zone.radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================
   BULLETS DRAW
========================= */

function drawBullets() {

    bullets.forEach(bullet => {

        ctx.fillStyle =
            bullet.owner === "player"
                ? "#fff3a1"
                : "#ff795f";

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

/* =========================
   HUMAN CHARACTER
========================= */

function drawHuman(x, y, angle, enemy = false) {

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(angle);

    /* shadow */

    ctx.fillStyle = "rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        13,
        18,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* legs */

    ctx.strokeStyle =
        enemy ? "#3d2924" : "#252b2a";

    ctx.lineWidth = 7;

    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(-7, 5);
    ctx.lineTo(-9, 20);

    ctx.moveTo(7, 5);
    ctx.lineTo(9, 20);

    ctx.stroke();

    /* body */

    ctx.fillStyle =
        enemy ? "#6d3b32" : "#394943";

    ctx.beginPath();

    ctx.roundRect(
        -13,
        -8,
        26,
        28,
        8
    );

    ctx.fill();

    /* vest */

    ctx.fillStyle =
        enemy ? "#4c2924" : "#28352f";

    ctx.fillRect(
        -9,
        -3,
        18,
        16
    );

    /* arms */

    ctx.strokeStyle =
        enemy ? "#a36e57" : "#b08b6c";

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.moveTo(-10, 0);
    ctx.lineTo(-18, -8);

    ctx.moveTo(10, 0);
    ctx.lineTo(18, -8);

    ctx.stroke();

    /* head */

    ctx.fillStyle =
        enemy ? "#a66f55" : "#c09470";

    ctx.beginPath();

    ctx.arc(
        0,
        -17,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* hair */

    ctx.fillStyle =
        enemy ? "#211b18" : "#33261d";

    ctx.beginPath();

    ctx.arc(
        0,
        -20,
        9,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    /* weapon */

    ctx.strokeStyle = "#171a19";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(8, -7);
    ctx.lineTo(32, -7);

    ctx.stroke();

    ctx.restore();
}

/* =========================
   PLAYER DRAW
========================= */

function drawPlayer() {

    drawHuman(
        player.x,
        player.y,
        player.angle,
        false
    );
}

/* =========================
   ENEMY DRAW
========================= */

function drawEnemies() {

    enemies.forEach(enemy => {

        if (!enemy.alive) return;

        drawHuman(
            enemy.x,
            enemy.y,
            enemy.angle,
            true
        );

        /* health */

        ctx.fillStyle = "#222";

        ctx.fillRect(
            enemy.x - 20,
            enemy.y - 40,
            40,
            5
        );

        ctx.fillStyle = "#d8584e";

        ctx.fillRect(
            enemy.x - 20,
            enemy.y - 40,
            40 * (enemy.health / 100),
            5
        );
    });
}

/* =========================
   MINIMAP
========================= */

function drawMiniMap() {

    const size = miniMap.width;

    miniCtx.clearRect(
        0,
        0,
        size,
        size
    );

    miniCtx.fillStyle = "#526b43";

    miniCtx.fillRect(
        0,
        0,
        size,
        size
    );

    const scale =
        size / WORLD.width;

    /* water */

    miniCtx.fillStyle = "#3e7180";

    waterAreas.forEach(water => {

        miniCtx.fillRect(
            water.x * scale,
            water.y * scale,
            water.width * scale,
            water.height * scale
        );
    });

    /* buildings */

    miniCtx.fillStyle = "#42453f";

    buildings.forEach(building => {

        miniCtx.fillRect(
            building.x * scale,
            building.y * scale,
            building.width * scale,
            building.height * scale
        );
    });

    /* zone */

    miniCtx.strokeStyle = "#8ec8ff";

    miniCtx.lineWidth = 2;

    miniCtx.beginPath();

    miniCtx.arc(
        zone.x * scale,
        zone.y * scale,
        zone.radius * scale,
        0,
        Math.PI * 2
    );

    miniCtx.stroke();

    /* enemies */

    enemies.forEach(enemy => {

        if (!enemy.alive) return;

        miniCtx.fillStyle = "#e85c50";

        miniCtx.fillRect(
            enemy.x * scale - 1.5,
            enemy.y * scale - 1.5,
            3,
            3
        );
    });

    /* player */

    miniCtx.fillStyle = "#ffffff";

    miniCtx.beginPath();

    miniCtx.arc(
        player.x * scale,
        player.y * scale,
        4,
        0,
        Math.PI * 2
    );

    miniCtx.fill();
}

/* =========================
   MESSAGE
========================= */

let messageTimer;

function showMessage(text) {

    message.textContent = text;
    message.style.opacity = "1";

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {

        message.style.opacity = "0";

    }, 900);
}

/* =========================
   DAMAGE
========================= */

function showDamage() {

    const flash =
        document.createElement("div");

    flash.className = "damage-flash";

    document.getElementById("hud")
        .appendChild(flash);

    setTimeout(() => {
        flash.remove();
    }, 250);
}

/* =========================
   KILL FEED
========================= */

function addKillFeed(text) {

    const item =
        document.createElement("div");

    item.className = "kill-message";

    item.textContent = text;

    killFeed.appendChild(item);

    setTimeout(() => {
        item.remove();
    }, 3000);
}

/* =========================
   GAME OVER
========================= */

function gameOver() {

    mouse.down = false;

    showMessage("GAME OVER");

    setTimeout(() => {

        location.reload();

    }, 3000);
}

/* =========================
   SHOOT LOOP
========================= */

function handleShooting() {

    if (mouse.down && !reloading) {
        shoot();
    }

    if (player.fireCooldown > 0) {
        player.fireCooldown--;
    }
}

/* =========================
   GAME LOOP
========================= */

function update() {

    updatePlayer();

    updateCamera();

    handleShooting();

    updateBullets();

    updateEnemies();

    updateLoot();

    updateZone();

    updateHUD();
}

function draw() {

    drawWorld();

    drawMiniMap();
}

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();
