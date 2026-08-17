const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");

const minimap=document.getElementById("minimap");
const miniCtx=minimap.getContext("2d");

const startScreen=document.getElementById("startScreen");
const endScreen=document.getElementById("endScreen");
const startButton=document.getElementById("startButton");

const aliveText=document.getElementById("alive");
const killsText=document.getElementById("kills");
const ammoText=document.getElementById("ammo");

const healthBar=document.getElementById("health");
const armorBar=document.getElementById("armor");

const zoneStatus=document.getElementById("zoneStatus");

let W=window.innerWidth;
let H=window.innerHeight;

function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
    minimap.width=202;
    minimap.height=202;
}

window.addEventListener("resize",resize);
resize();

const WORLD={
    width:6000,
    height:6000
};

const camera={
    x:0,
    y:0
};

const player={
    x:3000,
    y:3000,
    radius:18,
    speed:4,
    angle:0,
    health:100,
    armor:100,
    ammo:30,
    reserve:120,
    kills:0
};

const mouse={
    x:W/2,
    y:H/2,
    down:false
};

const keys={};

let gameStarted=false;
let shootCooldown=0;

const buildings=[];
const trees=[];
const rocks=[];
const roads=[];
const loot=[];
const enemies=[];
const bullets=[];

function random(min,max){
    return Math.random()*(max-min)+min;
}

function distance(a,b,c,d){
    return Math.hypot(a-c,b-d);
}

function createMap(){

    roads.push(
        {x:0,y:2820,w:6000,h:180},
        {x:2820,y:0,w:180,h:6000},
        {x:400,y:1050,w:5200,h:130},
        {x:1000,y:400,w:130,h:5200},
        {x:700,y:4000,w:4600,h:120}
    );

    for(let i=0;i<65;i++){

        const w=random(110,300);
        const h=random(90,240);

        buildings.push({
            x:random(150,WORLD.width-w-150),
            y:random(150,WORLD.height-h-150),
            w,
            h
        });
    }

    for(let i=0;i<420;i++){

        trees.push({
            x:random(50,WORLD.width-50),
            y:random(50,WORLD.height-50),
            r:random(12,27)
        });
    }

    for(let i=0;i<190;i++){

        rocks.push({
            x:random(50,WORLD.width-50),
            y:random(50,WORLD.height-50),
            r:random(7,20)
        });
    }

    for(let i=0;i<130;i++){

        loot.push({
            x:random(100,WORLD.width-100),
            y:random(100,WORLD.height-100),
            type:Math.random()>.5?"ammo":"armor",
            taken:false
        });
    }

    for(let i=0;i<24;i++){

        enemies.push({
            x:random(300,WORLD.width-300),
            y:random(300,WORLD.height-300),
            radius:17,
            health:100,
            speed:random(.45,1),
            cooldown:random(20,90)
        });
    }
}

createMap();

const zone={
    x:3000,
    y:3000,
    radius:2550,
    targetRadius:2550,
    timer:0,
    phase:0
};

function updateZone(){

    zone.timer++;

    if(zone.timer>1000){

        zone.phase++;

        zone.targetRadius=Math.max(
            500,
            zone.targetRadius-400
        );

        zone.timer=0;
    }

    zone.radius+=(zone.targetRadius-zone.radius)*.0015;

    const d=distance(
        player.x,
        player.y,
        zone.x,
        zone.y
    );

    if(d>zone.radius){

        player.health-=.035;

        zoneStatus.textContent="⚠ OUTSIDE SAFE ZONE";
        zoneStatus.style.background="rgba(90,30,25,.95)";

    }else{

        zoneStatus.textContent="SAFE ZONE";
        zoneStatus.style.background="rgba(26,52,30,.9)";
    }
}

window.addEventListener("keydown",e=>{

    keys[e.key.toLowerCase()]=true;

    if(e.key.toLowerCase()==="r"){
        reload();
    }
});

window.addEventListener("keyup",e=>{
    keys[e.key.toLowerCase()]=false;
});

canvas.addEventListener("mousemove",e=>{

    mouse.x=e.clientX;
    mouse.y=e.clientY;
});

canvas.addEventListener("mousedown",e=>{

    if(e.button===0){
        mouse.down=true;
    }
});

window.addEventListener("mouseup",e=>{

    if(e.button===0){
        mouse.down=false;
    }
});

function updatePlayer(){

    let dx=0;
    let dy=0;

    if(keys.w||keys.arrowup)dy--;
    if(keys.s||keys.arrowdown)dy++;
    if(keys.a||keys.arrowleft)dx--;
    if(keys.d||keys.arrowright)dx++;

    if(dx||dy){

        const len=Math.hypot(dx,dy);

        dx/=len;
        dy/=len;

        player.x+=dx*player.speed;
        player.y+=dy*player.speed;
    }

    player.x=Math.max(
        30,
        Math.min(WORLD.width-30,player.x)
    );

    player.y=Math.max(
        30,
        Math.min(WORLD.height-30,player.y)
    );

    const mx=mouse.x+camera.x;
    const my=mouse.y+camera.y;

    player.angle=Math.atan2(
        my-player.y,
        mx-player.x
    );
}

function updateCamera(){

    camera.x=player.x-W/2;
    camera.y=player.y-H/2;

    camera.x=Math.max(
        0,
        Math.min(WORLD.width-W,camera.x)
    );

    camera.y=Math.max(
        0,
        Math.min(WORLD.height-H,camera.y)
    );
}

function shoot(){

    if(shootCooldown>0)return;

    if(player.ammo<=0){
        reload();
        return;
    }

    player.ammo--;

    shootCooldown=9;

    bullets.push({
        x:player.x+Math.cos(player.angle)*24,
        y:player.y+Math.sin(player.angle)*24,
        angle:player.angle,
        speed:16,
        life:70
    });

    updateAmmo();
}

function updateBullets(){

    if(shootCooldown>0)shootCooldown--;

    for(let i=bullets.length-1;i>=0;i--){

        const b=bullets[i];

        b.x+=Math.cos(b.angle)*b.speed;
        b.y+=Math.sin(b.angle)*b.speed;

        b.life--;

        let removed=false;

        for(let j=enemies.length-1;j>=0;j--){

            const enemy=enemies[j];

            if(distance(
                b.x,b.y,
                enemy.x,enemy.y
            )<enemy.radius+5){

                enemy.health-=50;

                bullets.splice(i,1);
                removed=true;

                if(enemy.health<=0){

                    enemies.splice(j,1);

                    player.kills++;

                    killsText.textContent=player.kills;
                    aliveText.textContent=enemies.length+1;
                }

                break;
            }
        }

        if(!removed&&b.life<=0){
            bullets.splice(i,1);
        }
    }
}

function reload(){

    if(player.ammo>=30)return;
    if(player.reserve<=0)return;

    const needed=30-player.ammo;
    const amount=Math.min(
        needed,
        player.reserve
    );

    player.ammo+=amount;
    player.reserve-=amount;

    updateAmmo();
}

function updateAmmo(){

    ammoText.textContent=
        `${player.ammo} / ${player.reserve}`;
}

function updateEnemies(){

    enemies.forEach(enemy=>{

        const dx=player.x-enemy.x;
        const dy=player.y-enemy.y;

        const d=Math.hypot(dx,dy);

        if(d<800&&d>90){

            enemy.x+=(dx/d)*enemy.speed;
            enemy.y+=(dy/d)*enemy.speed;
        }

        if(d<45&&enemy.cooldown<=0){

            if(player.armor>0){
                player.armor=Math.max(
                    0,
                    player.armor-8
                );
            }else{
                player.health-=8;
            }

            enemy.cooldown=65;
        }

        enemy.cooldown--;

        enemy.x=Math.max(
            20,
            Math.min(WORLD.width-20,enemy.x)
        );

        enemy.y=Math.max(
            20,
            Math.min(WORLD.height-20,enemy.y)
        );
    });
}

function updateLoot(){

    loot.forEach(item=>{

        if(item.taken)return;

        if(distance(
            player.x,player.y,
            item.x,item.y
        )<38){

            if(item.type==="ammo"){

                player.reserve+=30;

            }else{

                player.armor=Math.min(
                    100,
                    player.armor+35
                );
            }

            item.taken=true;

            updateAmmo();
        }
    });
}

function drawGround(){

    ctx.fillStyle="#3d5138";
    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    for(let x=0;x<WORLD.width;x+=200){

        for(let y=0;y<WORLD.height;y+=200){

            if((x+y)%400===0){

                ctx.fillStyle="rgba(255,255,255,.018)";

            }else{

                ctx.fillStyle="rgba(0,0,0,.018)";
            }

            ctx.fillRect(x,y,200,200);
        }
    }
}

function drawRoads(){

    roads.forEach(road=>{

        ctx.fillStyle="#41423e";

        ctx.fillRect(
            road.x,
            road.y,
            road.w,
            road.h
        );

        ctx.strokeStyle="rgba(255,255,255,.12)";
        ctx.lineWidth=3;
        ctx.setLineDash([30,28]);

        ctx.beginPath();

        if(road.w>road.h){

            ctx.moveTo(
                road.x,
                road.y+road.h/2
            );

            ctx.lineTo(
                road.x+road.w,
                road.y+road.h/2
            );

        }else{

            ctx.moveTo(
                road.x+road.w/2,
                road.y
            );

            ctx.lineTo(
                road.x+road.w/2,
                road.y+road.h
            );
        }

        ctx.stroke();

        ctx.setLineDash([]);
    });
}

function drawBuildings(){

    buildings.forEach(b=>{

        ctx.fillStyle="rgba(0,0,0,.3)";

        ctx.fillRect(
            b.x+9,
            b.y+11,
            b.w,
            b.h
        );

        ctx.fillStyle="#62665e";

        ctx.fillRect(
            b.x,
            b.y,
            b.w,
            b.h
        );

        ctx.strokeStyle="#252a25";
        ctx.lineWidth=5;

        ctx.strokeRect(
            b.x,
            b.y,
            b.w,
            b.h
        );

        ctx.fillStyle="#454941";

        for(let x=b.x+15;x<b.x+b.w-15;x+=35){

            ctx.fillRect(
                x,
                b.y+12,
                16,
                8
            );
        }
    });
}

function drawTrees(){

    trees.forEach(t=>{

        ctx.fillStyle="rgba(0,0,0,.25)";

        ctx.beginPath();

        ctx.arc(
            t.x+5,
            t.y+7,
            t.r,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.fillStyle="#243b26";

        ctx.beginPath();

        ctx.arc(
            t.x,
            t.y,
            t.r,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.fillStyle="#405d3a";

        ctx.beginPath();

        ctx.arc(
            t.x-5,
            t.y-6,
            t.r*.65,
            0,
            Math.PI*2
        );

        ctx.fill();
    });
}

function drawRocks(){

    rocks.forEach(r=>{

        ctx.fillStyle="#666b62";

        ctx.beginPath();

        ctx.arc(
            r.x,
            r.y,
            r.r,
            0,
            Math.PI*2
        );

        ctx.fill();
    });
}

function drawLoot(){

    loot.forEach(item=>{

        if(item.taken)return;

        ctx.fillStyle=
            item.type==="ammo"
            ?"#d0b34b"
            :"#6c99b6";

        ctx.fillRect(
            item.x-8,
            item.y-8,
            16,
            16
        );

        ctx.strokeStyle="rgba(255,255,255,.8)";
        ctx.strokeRect(
            item.x-8,
            item.y-8,
            16,
            16
        );
    });
}

function drawEnemies(){

    enemies.forEach(enemy=>{

        ctx.fillStyle="rgba(0,0,0,.3)";

        ctx.beginPath();

        ctx.ellipse(
            enemy.x+3,
            enemy.y+7,
            19,
            11,
            0,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.fillStyle="#8b3e36";

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.fillStyle="#e06358";

        ctx.fillRect(
            enemy.x-13,
            enemy.y-27,
            26*(enemy.health/100),
            4
        );
    });
}

function drawBullets(){

    bullets.forEach(b=>{

        ctx.fillStyle="#f0dc94";

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            4,
            0,
            Math.PI*2
        );

        ctx.fill();
    });
}

function drawPlayer(){

    ctx.fillStyle="rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        player.x+3,
        player.y+8,
        23,
        12,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle="#d7d9d4";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.strokeStyle="#1e241f";
    ctx.lineWidth=7;

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );

    ctx.lineTo(
        player.x+
        Math.cos(player.angle)*30,
        player.y+
        Math.sin(player.angle)*30
    );

    ctx.stroke();

    ctx.fillStyle="#fff";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        5,
        0,
        Math.PI*2
    );

    ctx.fill();
}

function drawZone(){

    ctx.save();

    ctx.fillStyle="rgba(40,80,110,.16)";

    ctx.beginPath();

    ctx.rect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    ctx.arc(
        zone.x,
        zone.y,
        zone.radius,
        0,
        Math.PI*2,
        true
    );

    ctx.fill();

    ctx.strokeStyle="rgba(190,225,255,.9)";
    ctx.lineWidth=9;

    ctx.beginPath();

    ctx.arc(
        zone.x,
        zone.y,
        zone.radius,
        0,
        Math.PI*2
    );

    ctx.stroke();

    ctx.restore();
}

function drawWorld(){

    ctx.clearRect(0,0,W,H);

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    drawGround();
    drawRoads();
    drawBuildings();
    drawRocks();
    drawTrees();
    drawLoot();
    drawZone();
    drawEnemies();
    drawBullets();
    drawPlayer();

    ctx.restore();
}

function drawMinimap(){

    const size=minimap.width;
    const scale=size/WORLD.width;

    miniCtx.clearRect(
        0,
        0,
        size,
        size
    );

    miniCtx.fillStyle="#344832";

    miniCtx.fillRect(
        0,
        0,
        size,
        size
    );

    roads.forEach(r=>{

        miniCtx.fillStyle="#555650";

        miniCtx.fillRect(
            r.x*scale,
            r.y*scale,
            r.w*scale,
            r.h*scale
        );
    });

    buildings.forEach(b=>{

        miniCtx.fillStyle="#73756f";

        miniCtx.fillRect(
            b.x*scale,
            b.y*scale,
            b.w*scale,
            b.h*scale
        );
    });

    miniCtx.strokeStyle="#c9e4ff";
    miniCtx.lineWidth=2;

    miniCtx.beginPath();

    miniCtx.arc(
        zone.x*scale,
        zone.y*scale,
        zone.radius*scale,
        0,
        Math.PI*2
    );

    miniCtx.stroke();

    enemies.forEach(enemy=>{

        miniCtx.fillStyle="#df554d";

        miniCtx.beginPath();

        miniCtx.arc(
            enemy.x*scale,
            enemy.y*scale,
            2,
            0,
            Math.PI*2
        );

        miniCtx.fill();
    });

    miniCtx.fillStyle="#fff";

    miniCtx.beginPath();

    miniCtx.arc(
        player.x*scale,
        player.y*scale,
        4,
        0,
        Math.PI*2
    );

    miniCtx.fill();
}

function updateUI(){

    healthBar.style.width=
        Math.max(0,player.health)+"%";

    armorBar.style.width=
        Math.max(0,player.armor)+"%";

    aliveText.textContent=
        enemies.length+1;

    if(player.health<=0){

        gameOver(
            "DEFEATED",
            "YOU DID NOT SURVIVE THE VORTEX"
        );
    }

    if(enemies.length===0){

        gameOver(
            "VICTORY",
            "YOU ARE THE LAST SURVIVOR"
        );
    }
}

function gameOver(title,text){

    if(!gameStarted)return;

    gameStarted=false;

    document.getElementById("endTitle").textContent=title;
    document.getElementById("endText").textContent=
        `${text} • KILLS: ${player.kills}`;

    endScreen.style.display="flex";
}

startButton.addEventListener("click",()=>{

    startScreen.style.display="none";
    gameStarted=true;
});

function loop(){

    if(gameStarted){

        updatePlayer();
        updateCamera();
        updateZone();
        updateBullets();
        updateEnemies();
        updateLoot();

        if(mouse.down){
            shoot();
        }

        updateUI();
    }

    drawWorld();
    drawMinimap();

    requestAnimationFrame(loop);
}

updateAmmo();
loop();
