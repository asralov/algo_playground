const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d');
let sim = new AntSimulation(), running = false, target = 0, lastTime = 0, credit = 0;
let width = 0, height = 0, zoom = 19, camera = {x:0,y:0}, drag = null;
// Logarithmic control gives fine adjustments at walking speeds, with fast exploration available.
const playbackSpeed = () => Math.pow(10000, Number($('speed').value) / 1000);
let pose = {x:0,y:0,angle:-Math.PI/4}, previousPose = {...pose};
let manualMotion = false, gait = 0;
function heading() {
  const directions = sim.mode === 'hex' ? [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]] : [[0,-1],[1,0],[0,1],[-1,0]];
  const d = directions[sim.direction], a = ground(sim.x,sim.y), b = ground(sim.x+d[0],sim.y+d[1]);
  return Math.atan2((b.x+b.y-a.x-a.y)*.5,b.x-b.y-a.x+a.y);
}
function advance() {
  previousPose = {...ground(sim.x,sim.y),angle:heading()};
  sim.step();
}
function interpolate(alpha) {
  const destination = ground(sim.x,sim.y), angle = heading();
  const turn = Math.atan2(Math.sin(angle-previousPose.angle), Math.cos(angle-previousPose.angle));
  // Turn during the first part of a stride, then travel continuously between cell centers.
  const rotation = Math.min(1,alpha*3), travel = alpha*alpha*(3-2*alpha);
  pose = {x:previousPose.x+(destination.x-previousPose.x)*travel,y:previousPose.y+(destination.y-previousPose.y)*travel,angle:previousPose.angle+turn*rotation};
}
const ground = (x,y) => sim.mode === 'hex' ? {x: Math.sqrt(3)*(x+y/2), y:1.5*y} : {x,y};
function project(x,y,z=0) { return {x:width/2+(x-y-camera.x+camera.y)*zoom, y:height/2+(x+y-camera.x-camera.y)*zoom*.5-z}; }
function polygon(points,fill,stroke) {
  ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}
}
function tile(x,y,dark) {
  const g=ground(x,y), lift=dark?5:0;
  const vertices = sim.mode === 'hex' ? Array.from({length:6},(_,i)=>{const a=(i*60+30)*Math.PI/180;return {x:g.x+Math.cos(a)*.97,y:g.y+Math.sin(a)*.97};}) : [{x:x-.49,y:y-.49},{x:x+.49,y:y-.49},{x:x+.49,y:y+.49},{x:x-.49,y:y+.49}];
  const top=vertices.map(v=>project(v.x,v.y,lift));
  if(dark) for(let i=0;i<vertices.length;i++){const j=(i+1)%vertices.length;polygon([top[i],top[j],project(vertices[j].x,vertices[j].y),project(vertices[i].x,vertices[i].y)],'#3b7b43');}
  polygon(top,dark?'#64ae67':'#f5f9ef',dark?'#4b9652':'#d6e3ce');
}
function draw() {
  ctx.clearRect(0,0,width,height);
  const ant=pose;
  // Invert the viewport to bound work independently of world history.
  const rx=width/(4*zoom)+height/(2*zoom)+4;
  let minX,maxX,minY,maxY;
  if(sim.mode==='hex') {minY=Math.floor((camera.y-rx)/1.5);maxY=Math.ceil((camera.y+rx)/1.5);minX=Math.floor((camera.x-rx)/Math.sqrt(3)-maxY/2);maxX=Math.ceil((camera.x+rx)/Math.sqrt(3)-minY/2);}
  else {minX=Math.floor(camera.x-rx);maxX=Math.ceil(camera.x+rx);minY=Math.floor(camera.y-rx);maxY=Math.ceil(camera.y+rx);}
  const visible=[];
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const g=ground(x,y),p=project(g.x,g.y);if(p.x>-zoom*2&&p.x<width+zoom*2&&p.y>-zoom*2&&p.y<height+zoom*2)visible.push({x,y,depth:g.x+g.y});}
  visible.sort((a,b)=>a.depth-b.depth).forEach(t=>tile(t.x,t.y,sim.dark.has(`${t.x},${t.y}`)));
  const p=project(ant.x,ant.y,7);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(pose.angle);
  const size=Math.max(6,zoom*.48);
  ctx.scale(size,size);
  ctx.fillStyle='#18251625';ctx.beginPath();ctx.ellipse(-.15,.27,1.2,.46,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#39291f';ctx.lineWidth=.09;ctx.lineCap='round';ctx.lineJoin='round';
  // Alternating tripod gait: three articulated legs touch down while the other three swing.
  for(let i=-1;i<=1;i++)for(const side of [-1,1]){
    const stride=Math.sin(gait+(i===0?Math.PI:0)+(side===1?Math.PI:0))*.2;
    ctx.beginPath();ctx.moveTo(i*.22,side*.12);ctx.lineTo(i*.58+stride,side*.57);ctx.lineTo(i*.82+stride-.18,side*(.92-Math.max(0,stride)*.35));ctx.stroke();
  }
  function segment(x,rx,ry) {
    const shine=ctx.createRadialGradient(x-.08,-.12,.02,x,0,rx);
    shine.addColorStop(0,'#80634a');shine.addColorStop(.4,'#483025');shine.addColorStop(1,'#201b18');
    ctx.fillStyle=shine;ctx.beginPath();ctx.ellipse(x,0,rx,ry,0,0,Math.PI*2);ctx.fill();
  }
  segment(-.71,.58,.34);segment(-.14,.12,.13);segment(.17,.34,.21);segment(.65,.28,.25);
  // Elbowed antennae and small mandibles keep the silhouette recognizably insect-like.
  ctx.lineWidth=.055;
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(.78,side*.14);ctx.lineTo(1.03,side*.37);ctx.lineTo(1.37,side*(.42+Math.sin(gait*.35)*.04));ctx.stroke();
    ctx.beginPath();ctx.moveTo(.88,side*.09);ctx.lineTo(1.04,side*.12);ctx.lineTo(1.08,side*.04);ctx.stroke();
    ctx.fillStyle='#100f0d';ctx.beginPath();ctx.ellipse(.66,side*.2,.065,.045,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function update(status) {
  $('count').textContent=sim.steps.toLocaleString();$('tiles').textContent=sim.dark.size.toLocaleString();$('position').textContent=`${sim.x}, ${sim.y}`;
  if(status)$('status').textContent=status;
  $('run').disabled=running||manualMotion;$('step').disabled=running||manualMotion;$('pause').disabled=manualMotion||(!running&&target<=sim.steps&&credit>=1)||target===0;
  $('pause').textContent=running?'Pause':'Resume';
}
function start(steps){target=sim.steps+steps;credit=1;lastTime=performance.now();running=true;manualMotion=false;update('Running');}
function reset(){running=false;manualMotion=false;target=0;credit=0;sim=new AntSimulation($('mode').value);pose={...ground(0,0),angle:heading()};previousPose={...pose};gait=0;camera={x:0,y:0};$('follow').checked=true;update('Ready');draw();}
$('run-form').addEventListener('submit',e=>{e.preventDefault();const n=Number($('steps').value);if(Number.isInteger(n)&&n>=1&&n<=1000000)start(n);});
$('pause').onclick=()=>{running=!running;lastTime=performance.now();update(running?'Running':'Paused');};
$('step').onclick=()=>{advance();credit=0;manualMotion=true;lastTime=performance.now();update('Stepping');};
$('reset').onclick=reset;
$('mode').onchange=()=>{const hex=$('mode').value==='hex';$('rules').textContent=`Light tile: turn right ${hex?60:90}°. Green tile: turn left ${hex?60:90}°. Flip the tile, then move forward.`;$('geometry').textContent=hex?'HEXAGONAL VARIANT':'CLASSIC WORLD';reset();};
$('highway').onclick=()=>{$('mode').value='square';$('mode').onchange();$('steps').value=12000;$('speed').value=850;$('speed').oninput();start(12000);};
$('speed').oninput=()=>{const speed=playbackSpeed();$('speed-value').textContent=`${speed<100?speed.toFixed(1):Math.round(speed).toLocaleString()} steps/s`;$('speed').setAttribute('aria-valuetext',$('speed-value').textContent);};
function changeZoom(factor){zoom=Math.max(10,Math.min(48,zoom*factor));draw();}
$('zoom-in').onclick=()=>changeZoom(1.2);$('zoom-out').onclick=()=>changeZoom(1/1.2);
$('home').onclick=()=>{$('follow').checked=true;draw();};$('follow').onchange=draw;
canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?1.1:1/1.1);},{passive:false});
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;$('follow').checked=false;const dx=(e.clientX-drag.x)/zoom,dy=(e.clientY-drag.y)/(zoom*.5);camera.x-=(dx+dy)/2;camera.y-=(dy-dx)/2;drag={x:e.clientX,y:e.clientY};draw();};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;};
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='+'||e.key==='-'){changeZoom(e.key==='+'?1.2:1/1.2);return;}$('follow').checked=false;const dx=e.key==='ArrowLeft'?-3:e.key==='ArrowRight'?3:0,dy=e.key==='ArrowUp'?-3:e.key==='ArrowDown'?3:0;camera.x+=(dx+dy)/2;camera.y+=(dy-dx)/2;draw();};
new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const ratio=window.devicePixelRatio||1;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}).observe(canvas);
function frame(time){
  const dt=Math.min(Math.max((time-lastTime)/1000,0),.05);
  let dirty=false;
  if(running||manualMotion){
    const speed=manualMotion?5:playbackSpeed();credit+=dt*speed;
    if(running){const n=Math.min(Math.floor(credit),target-sim.steps);for(let i=0;i<n;i++)advance();credit-=n;}
    interpolate(Math.min(credit,1));gait+=dt*Math.min(speed,12)*Math.PI*2;dirty=true;
    if(credit>=1&&(manualMotion||sim.steps>=target)){const wasManual=manualMotion;manualMotion=false;running=false;update(wasManual?(target>sim.steps?'Paused':'Ready'):'Complete');}
    else update(manualMotion?'Stepping':'Running');
  }
  if($('follow').checked){const blend=1-Math.exp(-dt*9);const dx=pose.x-camera.x,dy=pose.y-camera.y;if(Math.abs(dx)+Math.abs(dy)>.001){camera.x+=dx*blend;camera.y+=dy*blend;dirty=true;}}
  if(dirty)draw();lastTime=time;requestAnimationFrame(frame);
}
// Returning to a backgrounded tab never causes a burst of catch-up steps.
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
$('speed').oninput();reset();requestAnimationFrame(frame);
