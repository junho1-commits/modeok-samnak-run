// Photo is softly blurred once into a cache; character and obstacles remain crisp.
const finishArch=new Image();finishArch.src='assets/finish-arch.png';
const cherryPhoto=new Image();
cherryPhoto.src='assets/samnak-cherry.png?v=4';
const photoCache=document.createElement('canvas');
let photoCacheKey='',backgroundBlur=2,customPhotoUrl=null;
cherryPhoto.onload=()=>{photoCacheKey=''};
function drawCherryBackground(w,h,runner){
  if(!cherryPhoto.complete||!cherryPhoto.naturalWidth){ctx.fillStyle='#e8e3df';ctx.fillRect(0,0,w,h);return}
  const key=`${w}:${h}:${backgroundBlur}:${cherryPhoto.src}`;
  if(key!==photoCacheKey){
    photoCache.width=Math.ceil(w);photoCache.height=Math.ceil(h);
    const c=photoCache.getContext('2d'),scale=Math.max((w+24)/cherryPhoto.naturalWidth,(h+24)/cherryPhoto.naturalHeight);
    const pw=cherryPhoto.naturalWidth*scale,ph=cherryPhoto.naturalHeight*scale;
    c.filter=`blur(${backgroundBlur}px)`;c.drawImage(cherryPhoto,(w-pw)/2,(h-ph)/2,pw,ph);c.filter='none';photoCacheKey=key;
  }
  // Repeating forward zoom with a short dissolve replaces the old static 4% zoom.
  const travel=runner.distance/22,phase=travel%1,scale=Math.pow(1.8,phase),ax=w*.5,ay=h*.24;
  const layer=(zoom,alpha)=>{ctx.save();ctx.globalAlpha=alpha;ctx.translate(ax,ay);ctx.scale(zoom,zoom);ctx.drawImage(photoCache,-ax,-ay);ctx.restore()};
  if(travel<1)layer(scale,1);
  else{layer(scale*1.8,1);const t=Math.min(1,phase/.3);layer(scale,t*t*(3-2*t))}
  const light=ctx.createLinearGradient(0,0,0,h);light.addColorStop(0,'#fff8fc15');light.addColorStop(.6,'#fff8fc00');light.addColorStop(1,'#46394025');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
}
$('blurAmount').oninput=e=>{backgroundBlur=Number(e.target.value);$('blurValue').textContent=backgroundBlur+'px';photoCacheKey=''};
$('backgroundFile').onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){say('사진 파일을 선택해 주세요');return}
  const candidate=new Image(),url=URL.createObjectURL(file);
  candidate.onload=()=>{if(customPhotoUrl)URL.revokeObjectURL(customPhotoUrl);customPhotoUrl=url;cherryPhoto.src=url;photoCacheKey='';$('backgroundSource').textContent='선택한 촬영 사진: '+file.name};
  candidate.onerror=()=>{URL.revokeObjectURL(url);say('이 사진은 읽을 수 없어요. JPG 또는 PNG를 선택해 주세요')};candidate.src=url;
};
$('resetBackground').onclick=()=>{cherryPhoto.src='assets/samnak-cherry.png?v=4';if(customPhotoUrl)URL.revokeObjectURL(customPhotoUrl);customPhotoUrl=null;photoCacheKey='';$('backgroundFile').value='';$('backgroundSource').textContent='삼락 풍경을 참고한 실사풍 생성 이미지'};
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);ctx.fill()}
function flower(x,y,s){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*s*.6,y+Math.sin(a)*s*.6,s*.43,s*.43,'#f7bfd3')}ellipse(x,y,s*.28,s*.28,'#d99d74')}
function renderView(p,x,w,h){
  ctx.save();ctx.beginPath();ctx.rect(x,0,w,h);ctx.clip();ctx.translate(x,0);
  const cx=w*.5,horizon=h*.25,ground=h*.83;
  const project=(z)=>{const scale=14/(Math.max(-2,z)+14);return{x:cx,y:horizon+(ground-horizon)*scale,s:scale}};
  drawCherryBackground(w,h,p);
  for(let i=0;i<40;i++){
    const z=130-((i*17.3+p.distance*2+elapsed*.8)%130),q=project(z),spread=Math.sin(i*12.989)*5.5;
    const px=cx+spread*q.s*w/8,py=q.y-(30+(i%7)*34)*q.s+Math.sin(elapsed*.8+i)*9;
    ctx.save();ctx.translate(px,py);ctx.rotate(elapsed*.4+i);ctx.globalAlpha=.25+q.s*.35;
    ellipse(0,0,Math.max(1.5,7*q.s),Math.max(1,3.5*q.s),i%2?'#fff4f6':'#efb8ca');ctx.restore();
  }
  const items=(p.items||[]).filter(o=>!o.done&&o.at-p.distance> -2&&o.at-p.distance<120).sort((a,b)=>b.at-a.at);
  for(const o of items){
    const z=o.at-p.distance,q=project(z),s=q.s;
    if(o.type==='flower'){ellipse(cx,q.y,20*s,5*s,'#46324255');flower(cx,q.y-32*s,25*s)}
    else{
      // Larger raised obstacles, contrasting outline, shadow, and approach marker.
      ellipse(cx,q.y,55*s,13*s,'#39233188');
      ctx.save();ctx.strokeStyle='#fff9e9';ctx.lineWidth=Math.max(2,4*s);ctx.beginPath();ctx.moveTo(cx,q.y-112*s);ctx.lineTo(cx-37*s,q.y-8*s);ctx.lineTo(cx+37*s,q.y-8*s);ctx.closePath();ctx.stroke();ctx.restore();
      poly([[cx-46*s,q.y],[cx+46*s,q.y],[cx+37*s,q.y-12*s],[cx-37*s,q.y-12*s]],'#b9461d');
      const orange=ctx.createLinearGradient(cx-35*s,0,cx+35*s,0);orange.addColorStop(0,'#f46318');orange.addColorStop(.5,'#ffb03c');orange.addColorStop(1,'#da5015');
      poly([[cx,q.y-112*s],[cx-34*s,q.y-10*s],[cx+34*s,q.y-10*s]],orange);
      poly([[cx-12*s,q.y-76*s],[cx+12*s,q.y-76*s],[cx+19*s,q.y-56*s],[cx-19*s,q.y-56*s]],'#fff8e8');
      poly([[cx-23*s,q.y-44*s],[cx+23*s,q.y-44*s],[cx+29*s,q.y-24*s],[cx-29*s,q.y-24*s]],'#fff8e8');
      if(z<22){ctx.font=`bold ${mode===2?13:15}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff7df';ctx.strokeStyle='#6c341e';ctx.lineWidth=4;ctx.strokeText('점프!',cx,q.y-112*s-12);ctx.fillText('점프!',cx,q.y-112*s-12)}
    }
  }
  if(p.distance>LENGTH-85){
    const q=project(LENGTH-p.distance),archW=w*.96*q.s;
    const archH=archW*(finishArch.naturalHeight||800)/(finishArch.naturalWidth||1940);
    ellipse(cx,q.y,archW*.5,Math.max(2,12*q.s),'#332d3040');
    const stripeW=archW*.70,tile=stripeW/12;
    for(let row=0;row<2;row++)for(let col=0;col<12;col++){
      ctx.fillStyle=(row+col)%2?'#f8f4ef':'#423d3d';
      ctx.fillRect(cx-stripeW/2+col*tile,q.y-5*q.s+row*7*q.s,tile+.5,7*q.s);
    }
    if(finishArch.complete&&finishArch.naturalWidth)ctx.drawImage(finishArch,cx-archW/2,q.y-archH,archW,archH);
  }
  // Smaller runner with a higher camera leaves more road visible above its head.
  const size=Math.min(mode===2?210:230,h*.30),baseY=ground-8,jumping=p.jumpHeight*Math.min(1,h/790),moving=p.speed>.15,cycle=p.phase%1;
  ellipse(cx,baseY+1,size*.2*(1-Math.min(.35,jumping/250)),8,jumping>0?'#48263b25':'#48263b65');
  ctx.save();ctx.translate(cx+(moving?Math.sin(cycle*Math.PI*2)*1.3:0),baseY-jumping+(moving&&!jumping?Math.cos(cycle*Math.PI*4)*2:0));ctx.rotate(moving&&!jumping?Math.sin(cycle*Math.PI*2)*.012:0);
  if(state==='menu'||state==='result')drawSprite(ctx,p.character,0,0,0,size,size);
  else if(motion.complete&&motion.naturalWidth){const sw=motion.naturalWidth/8,sh=motion.naturalHeight/2,col=jumping>0?7:moving?Math.floor(cycle*6):6;ctx.drawImage(motion,col*sw,p.character*sh,sw,sh,-size*sw/sh/2,-size,size*sw/sh,size)}
  else drawSprite(ctx,p.character,jumping>0?3:moving?1+Math.floor(cycle*2):1,0,0,size,size);
  ctx.restore();
  if(p.messageTime>0&&state==='running'){ctx.font=`bold ${mode===2?12:15}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff7f5';ctx.strokeStyle='#704958';ctx.lineWidth=4;ctx.strokeText(p.message,cx,h*.19);ctx.fillText(p.message,cx,h*.19)}
  if(mode===2&&state!=='menu'){ctx.fillStyle=p.id?'#266f68':'#954464';ctx.font='bold 15px sans-serif';ctx.textAlign='left';ctx.fillText(`${p.id+1}P`,15,h*.27)}
  ctx.restore();
}
function render(){
  const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;
  if(mode===2){renderView(players[0],0,w/2,h);renderView(players[1],w/2,w/2,h);ctx.fillStyle='#ffffffbb';ctx.fillRect(w/2-2,0,4,h)}else renderView(players[0],0,w,h);
}
requestAnimationFrame(frame);


