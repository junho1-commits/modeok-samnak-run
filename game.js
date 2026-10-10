'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const atlas=new Image(),motion=new Image();atlas.src='assets/mascots.png';motion.src='assets/motion.png';
const held=new Set();let LENGTH=150,mode=1,character=0,state='menu',lastFrame=0,countdown=3,remaining=90,elapsed=0,jumpMode=true;
function newPlayer(id){return{id,character:id===0?character:1-character,distance:0,speed:0,targetSpeed:0,flowers:0,lastFoot:null,lastStep:-10,phase:0,jumpHeight:0,jumpVelocity:0,boost:0,message:'',messageTime:0,finishAt:null}}
let players=[newPlayer(0),newPlayer(1)];
atlas.onload=()=>{document.querySelectorAll('.choice').forEach((b,i)=>drawSprite(b.querySelector('canvas').getContext('2d'),i,0,75,175,170,170));$('start').disabled=false;$('start').textContent='꽃길 달리기 시작 →'};
atlas.onerror=()=>{$('start').textContent='캐릭터 파일을 확인해 주세요'};
function drawSprite(c,row,col,x,y,w,h){if(!atlas.complete||!atlas.naturalWidth)return;const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/2;c.drawImage(atlas,col*sw,row*sh,sw,sh,x-w/2,y-h,w,h)}
function visibility(id,show){$(id).hidden=!show}
function clearInput(){held.clear();document.querySelectorAll('.pads button').forEach(b=>b.classList.remove('active'))}
function setMode(value){mode=value;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',+b.dataset.mode===mode);b.setAttribute('aria-pressed',String(+b.dataset.mode===mode))});document.querySelector('.arena').classList.toggle('two-player',mode===2);visibility('pads2',mode===2);$('modeHint').textContent=mode===2?'1P: ← → · 스페이스 | 2P: A D · W':'← → 또는 A D · 스페이스 / ↑로 점프';$('characterHint').textContent=mode===2?'1P 캐릭터를 고르면 2P는 다른 친구가 돼요.':'함께 달릴 친구를 골라 주세요.';updateHud()}
function reset(){remaining=90;elapsed=0;players=[newPlayer(0),newPlayer(1)];for(const p of players){p.items=[];for(let at=36;at<LENGTH-10;at+=24)p.items.push({type:'flower',at,done:false});if($('jumpMode').checked)for(let at=58;at<LENGTH-12;at+=58)p.items.push({type:'cone',at,done:false,warned:false})}clearInput();jumpMode=$('jumpMode').checked;countdown=3;state='countdown';['menu','result','pausePanel'].forEach(id=>visibility(id,false));['progress','countdown'].forEach(id=>visibility(id,true));visibility('hud',mode===1);visibility('raceHud',mode===2);$('toast').textContent='';updateHud()}
function menu(){state='menu';players=[newPlayer(0),newPlayer(1)];clearInput();['hud','raceHud','progress','result','pausePanel','countdown'].forEach(id=>visibility(id,false));visibility('menu',true);$('toast').textContent='';updateHud()}
function foot(side,id=0){const p=players[id];if(state!=='running'||id>=mode||p.lastFoot===side)return;const interval=elapsed-p.lastStep;p.lastFoot=side;p.lastStep=elapsed;const cadence=interval<2?Math.min(8.5,2.4/Math.max(.16,interval)):3.4;p.targetSpeed=Math.min(8.5,Math.max(p.targetSpeed+.9,cadence));$(id?'stepHint2':'stepHint').textContent=side==='left'?'다음은 오른발 →':'← 다음은 왼발'}
function jump(id=0){const p=players[id];if(state==='running'&&id<mode&&p.jumpHeight<=0){p.jumpVelocity=490;p.jumpHeight=.01}}
function say(text,id=0){players[id].message=text;players[id].messageTime=2}
function pause(){if(state==='running'){state='paused';clearInput();visibility('pausePanel',true)}else if(state==='paused'){state='running';visibility('pausePanel',false);for(const p of players)p.lastStep=elapsed}}
function finish(winner){state='result';clearInput();visibility('hud',false);visibility('raceHud',false);visibility('result',true);for(const p of players)p.targetSpeed=0;
if(mode===1){const p=players[0],won=p.distance>=LENGTH;$('resultLabel').textContent=won?'꽃길 완주':'다음 도전을 기다릴게요';$('resultTitle').textContent=won?'꽃길 완주 성공! 🌸':'잘 달렸어요!';$('resultText').textContent=`${p.distance.toFixed(1)}미터 · 꽃 ${p.flowers}송이${won?' · 삼락 벚꽃길 완주!':''}`}
else{$('resultLabel').textContent=winner===null?'무승부':'경기 결과';$('resultTitle').textContent=winner===null?'무승부!':`${winner+1}P 승리! 🏆`;$('resultText').textContent=players.map(p=>`${p.id+1}P ${p.distance.toFixed(1)}미터 · 꽃 ${p.flowers}송이${p.finishAt!==null?' · '+p.finishAt.toFixed(2)+'초':''}`).join(' / ')}updateHud()}
function updateHud(){const p=players[0];$('time').textContent=Math.ceil(remaining);$('raceTime').textContent=Math.ceil(remaining);$('distance').textContent=Math.max(0,Math.ceil(LENGTH-p.distance));$('flowers').textContent=p.flowers;$('bar').style.width=`${p.distance/LENGTH*100}%`;$('bar2').style.width=`${players[1].distance/LENGTH*100}%`;visibility('bar2',mode===2);for(const p of players){$(p.id?'speed2':'speed').textContent=p.speed.toFixed(1);$('p'+p.id+'Distance').textContent=p.distance.toFixed(0)+'미터';$('p'+p.id+'Flowers').textContent=p.flowers+'송이'}const delta=players[0].distance-players[1].distance;$('raceLead').textContent=Math.abs(delta)<.5?'나란히 달리는 중':`${delta>0?'1P':'2P'} ${Math.abs(delta).toFixed(1)}미터 앞서는 중`}
function setDistance(value){if(![100,150,200].includes(value))return;LENGTH=value;document.querySelectorAll('[data-distance]').forEach(b=>{b.classList.toggle('selected',+b.dataset.distance===value);b.setAttribute('aria-pressed',String(+b.dataset.distance===value))});updateHud()}
document.querySelectorAll('[data-distance]').forEach(b=>b.onclick=()=>setDistance(+b.dataset.distance));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(+b.dataset.mode));document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{character=+b.dataset.character;players[0].character=character;players[1].character=1-character;document.querySelectorAll('.choice').forEach(c=>c.classList.toggle('selected',c===b))});
$('start').onclick=reset;$('again').onclick=reset;$('home').onclick=menu;$('quit').onclick=menu;$('pause').onclick=pause;$('pauseRace').onclick=pause;$('resume').onclick=pause;$('jump').onclick=()=>jump(0);$('jump2').onclick=()=>jump(1);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.arena').requestFullscreen()}catch{say('브라우저의 전체 화면 기능을 이용해 주세요')}};
function inputFor(code){if(code==='ArrowLeft')return[0,'left'];if(code==='ArrowRight')return[0,'right'];if(code==='KeyA')return[mode===2?1:0,'left'];if(code==='KeyD')return[mode===2?1:0,'right'];if(code==='Space'||code==='ArrowUp')return[0,'jump'];if(code==='KeyW')return[mode===2?1:0,'jump'];return null}
function padId(id,side){return(side==='left'?'leftPad':'rightPad')+(id?'2':'')}
window.addEventListener('keydown',e=>{const a=inputFor(e.code);if(a)e.preventDefault();if(e.repeat||held.has(e.code))return;held.add(e.code);if(a){if(a[1]==='jump')jump(a[0]);else{foot(a[1],a[0]);$(padId(a[0],a[1])).classList.add('active')}}if(e.code==='KeyP'||e.code==='Escape')pause()});
window.addEventListener('keyup',e=>{held.delete(e.code);const a=inputFor(e.code);if(a&&a[1]!=='jump')$(padId(a[0],a[1])).classList.remove('active')});window.addEventListener('blur',()=>{clearInput();if(state==='running')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause()});
for(let id=0;id<2;id++)for(const side of ['left','right']){const b=$(padId(id,side));b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('active');foot(side,id)};b.onpointerup=b.onpointercancel=()=>b.classList.remove('active')}
function update(dt){
if(state==='countdown'){countdown-=dt;$('countdown').textContent=countdown>.1?Math.ceil(countdown):'출발!';if(countdown<=-.5){state='running';visibility('countdown',false);for(let i=0;i<mode;i++)say('출발! 번갈아 달리기 · 점프로 고깔 넘기',i)}return}
if(state!=='running')return;elapsed+=dt;remaining=Math.max(0,remaining-dt);const crossed=[];
for(let id=0;id<mode;id++){const p=players[id];p.targetSpeed=Math.max(0,p.targetSpeed-dt*(elapsed-p.lastStep>.65?3.5:.35));p.speed+=(p.targetSpeed*(p.boost>0?1.3:1)-p.speed)*(1-Math.exp(-dt*5));if(p.speed<.015)p.speed=0;const previous=p.distance;p.distance=Math.min(LENGTH,p.distance+p.speed*dt);p.phase+=dt*(p.speed>.1?1.2+p.speed*.28:0);
if(p.jumpHeight>0){p.jumpHeight+=p.jumpVelocity*dt-.5*1100*dt*dt;p.jumpVelocity-=1100*dt;if(p.jumpHeight<=0){p.jumpHeight=0;p.jumpVelocity=0}}p.boost=Math.max(0,p.boost-dt);p.messageTime-=dt;
for(const o of p.items){if(o.type==='cone'&&!o.done&&!o.warned&&o.at-p.distance<Math.max(6,p.speed*1.15)){o.warned=true;say(id?'점프! W':'점프! 스페이스 / ↑',id)}if(!o.done&&p.distance>=o.at){o.done=true;if(o.type==='flower'){p.flowers++;if(p.flowers%4===0){p.boost=3;say('벚꽃 부스터! 🌸',id)}}else if(p.jumpHeight>30)say('멋진 점프!',id);else{p.targetSpeed*=.45;say('고깔에 닿았어요. 다음에는 점프!',id)}}}
if(previous<LENGTH&&p.distance>=LENGTH){p.finishAt=elapsed-dt+(LENGTH-previous)/Math.max(.001,p.speed);crossed.push(p)}
}
if(crossed.length){crossed.sort((a,b)=>a.finishAt-b.finishAt);finish(crossed.length===2&&Math.abs(crossed[0].finishAt-crossed[1].finishAt)<.001?null:crossed[0].id)}else if(remaining<=0){const delta=players[0].distance-players[1].distance;finish(mode===1?null:Math.abs(delta)<.05?null:delta>0?0:1)}
}
function frame(t){let dt=lastFrame?Math.min(.25,(t-lastFrame)/1000):0;lastFrame=t;while(dt>0){const step=Math.min(dt,1/120);update(step);dt-=step}updateHud();render();requestAnimationFrame(frame)}
setMode(1);



