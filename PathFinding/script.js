function generateMaze(rows, cols) {
  // make grid full of walls
  let maze = Array.from({ length: rows }, () => Array(cols).fill(1));
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  function carve(r, c) {
    maze[r][c] = 0;
    let directions = shuffle([
      [0, 2], // right
      [0, -2], // left
      [2, 0], // down
      [-2, 0], // up
    ]);
    for (let [dr, dc] of directions) {
      let nr = r + dr;
      let nc = c + dc;
      if (
        nr > 0 &&
        nr < rows - 1 &&
        nc > 0 &&
        nc < cols - 1 &&
        maze[nr][nc] === 1
      ) {
        maze[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }
  carve(1, 1);
  // add a 5% chance to tear down a wall and create a loop
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (maze[r][c] === 1 && Math.random() < 0.05) {
        maze[r][c] = 0;
      }
    }
  }
  return maze;
}


const $ = id => document.getElementById(id);
const strategies = {
  BFS: {fn:BFS,summary:'Explore outward in layers, visiting the nearest cells first.',guarantee:'Shortest route guaranteed',title:'A growing wave of possibilities.',copy:'Breadth-first search uses a queue. Because every move costs one, the first route to the goal has the fewest moves.',steps:['Put the start cell into a queue.','Take the oldest cell out and queue its unseen neighbors.','At the goal, follow parent links back to reveal the shortest route.']},
  DFS: {fn:DFS,summary:'Follow one branch deeply, then backtrack to try another.',guarantee:'Route may not be shortest',title:'Follow a branch. Then backtrack.',copy:'Depth-first search uses a stack. It pursues the most recently added cell, so its route depends strongly on neighbor order.',steps:['Push the start cell onto a stack.','Take the newest cell and push its unexplored neighbors.','Stop at the goal, or continue backtracking until no cells remain.']},
  Astar: {fn:Astar,summary:'Use distance traveled plus an estimate of distance to the goal.',guarantee:'Shortest route guaranteed here',title:'Give the search a sense of direction.',copy:'A* prioritizes f = g + h: moves already taken plus Manhattan distance to the goal. That estimate never overstates the remaining cost on this four-direction grid.',steps:['Start with g = 0 and estimate h using row and column distance.','Explore the candidate with the lowest f = g + h.','Update better routes as they appear; reconstruct the path at the goal.']}
};
let rows=23,cols=23,maze=generateMaze(rows,cols),start,goal,tool='wall';
let result=null,visitIndex=0,pathIndex=0,running=false,finished=false,credit=0,lastTime=0,current=null,painted=false,pointer=null;
const grid=$('grid');
let cells=[];
let waves=[],waveIndex=0,frontier=new Set(),activeCells=[];
const branching=()=>$('algorithm').value!=='DFS';
// Logarithmic sliders retain fine slow-speed control while allowing fast-forward.
const sliderRate=id=>Math.pow(1000,Number($(id).value)/1000);
const playbackRate=()=>sliderRate('speed');
const routeRate=()=>sliderRate('route-speed');
const formatRate=rate=>rate<10?rate.toFixed(1):Math.round(rate).toLocaleString();
function playbackLabel(){
  $('speed-value').textContent=`${formatRate(playbackRate())} ${branching()?'waves':'cells'}/s`;
  $('route-speed-value').textContent=`${formatRate(routeRate())} cells/s`;
  $('speed').setAttribute('aria-valuetext',$('speed-value').textContent);
  $('route-speed').setAttribute('aria-valuetext',$('route-speed-value').textContent);
  $('step').textContent=branching()?'Next wave':'Next step';
}
const cellAt=n=>cells[n.row*cols+n.col];
const same=(a,b)=>a&&b&&a.row===b.row&&a.col===b.col;
function status(phase,message){$('phase').textContent=phase;$('status').textContent=message;}
function lock(){
  const locked=!!result&&!finished;
  ['algorithm','mazeSize','newMaze','empty'].forEach(id=>$(id).disabled=locked);
  document.querySelectorAll('[data-tool]').forEach(b=>b.disabled=locked);
  $('run').disabled=running;$('run').textContent=locked?'Resume search':finished?'Replay search':'Visualize search';
  $('pause').disabled=!locked;$('pause').textContent=running?'Pause':'Resume';
  $('step').disabled=running||finished;
}
function resetStats(){$('visited-count').textContent='0';$('path-count').textContent='—';$('coverage').textContent='0%';$('current-cell').textContent='—';}
function clearSearch(){
  running=false;result=null;finished=false;credit=0;visitIndex=0;pathIndex=0;current=null;
  waves=[];waveIndex=0;frontier.clear();activeCells=[];
  cells.forEach(c=>{c.classList.remove('visited','path','current','frontier','spreading');c.style.removeProperty('--grow-from');});resetStats();lock();
  $('frontier-count').textContent='0';
  status('Ready','Start and goal are placed. Run a search or reshape the maze.');
}
function describeCell(r,c){
  const n={row:r,col:c},cell=cellAt(n),kind=same(n,start)?'start':same(n,goal)?'goal':maze[r][c]?'wall':'open';
  cell.classList.toggle('wall',!!maze[r][c]);cell.classList.toggle('start',same(n,start));cell.classList.toggle('goal',same(n,goal));
  cell.textContent=kind==='start'?'S':kind==='goal'?'G':'';
  cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${kind}`);
}
function render(){
  grid.replaceChildren();cells=[];grid.style.setProperty('--cols',cols);$('board-title').textContent=`${rows} × ${cols} maze`;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const cell=document.createElement('button');cell.type='button';cell.className='cell';cell.dataset.row=r;cell.dataset.col=c;cell.tabIndex=r===start.row&&c===start.col?0:-1;grid.append(cell);cells.push(cell);describeCell(r,c);
  }
  clearSearch();
}
function placeEndpoints(){
  start={row:1,col:1};maze[1][1]=0;
  // Choose a distant reachable cell, including on generated mazes with disconnected pockets.
  const queue=[start],seen=new Set([key(start)]);let head=0;
  while(head<queue.length){const n=queue[head++];for(const neighbor of getNeighbors(maze,n.row,n.col))if(!seen.has(key(neighbor))){seen.add(key(neighbor));queue.push(neighbor);}}
  goal=queue.at(-1);if(same(start,goal)){goal={row:1,col:2};maze[1][2]=0;}
}
function edit(cell){
  if(result&&!finished)return;
  if(!cell?.classList.contains('cell'))return;
  const n={row:Number(cell.dataset.row),col:Number(cell.dataset.col)};
  if(result)clearSearch();
  if(tool==='wall'||tool==='erase'){if(same(n,start)||same(n,goal))return;maze[n.row][n.col]=tool==='wall'?1:0;describeCell(n.row,n.col);}
  else {if(same(n,tool==='start'?goal:start))return;const old=tool==='start'?start:goal;maze[n.row][n.col]=0;if(tool==='start')start=n;else goal=n;describeCell(old.row,old.col);describeCell(n.row,n.col);}
}
grid.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.target.classList.contains('cell'))return;
  pointer=e.pointerId;painted=true;grid.setPointerCapture(pointer);edit(e.target);
});
grid.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||!['wall','erase'].includes(tool))return;edit(document.elementFromPoint(e.clientX,e.clientY));});
grid.addEventListener('pointerup',()=>{pointer=null;setTimeout(()=>painted=false,0);});
grid.addEventListener('pointercancel',()=>{pointer=null;painted=false;});
grid.addEventListener('lostpointercapture',()=>{pointer=null;});
grid.addEventListener('click',e=>{if(e.detail===0||!painted)edit(e.target);});
grid.addEventListener('keydown',e=>{
  if(!e.target.classList.contains('cell'))return;
  const moves={ArrowUp:-cols,ArrowDown:cols,ArrowLeft:-1,ArrowRight:1};
  if(!(e.key in moves))return;e.preventDefault();const index=cells.indexOf(e.target),next=index+moves[e.key];
  if(next<0||next>=cells.length||((e.key==='ArrowLeft'||e.key==='ArrowRight')&&Math.floor(next/cols)!==Math.floor(index/cols)))return;
  cells.forEach(c=>c.tabIndex=-1);cells[next].tabIndex=0;cells[next].focus();
});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{
  tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $('hint').textContent=tool==='wall'?'Drag across cells to draw walls. Start and goal stay protected.':tool==='erase'?'Drag across walls to open a passage.':`Select a cell to move the ${tool}. Use arrow keys and Enter for keyboard editing.`;
});
function prepare(){
  if(result&&!finished)return;
  clearSearch();result=strategies[$('algorithm').value].fn(maze,start,goal);
  if(branching()){
    // Preserve search order. Group only consecutive, equally deep expansions;
    // A* additionally requires equal f, so lower-priority branches never jump ahead.
    for(const event of result.events){
      let wave=waves.at(-1);
      if(!wave||wave[0].depth!==event.depth||wave[0].priority!==event.priority){wave=[];waves.push(wave);}
      wave.push(event);
    }
    frontier.add(key(start));cellAt(start).classList.add('frontier');$('frontier-count').textContent='1';
  }
  lock();
}
function spread(node){
  const cell=cellAt(node),dr=node.row-node.from.row,dc=node.col-node.from.col;
  cell.style.setProperty('--grow-from',dr>0?'50% 0%':dr<0?'50% 100%':dc>0?'0% 50%':'100% 50%');
  cell.style.setProperty('--spread-duration',`${Math.max(16,Math.min(650,850/playbackRate()))}ms`);
  cell.classList.add('frontier','spreading');frontier.add(key(node));
}
function advance(){
  if(!result||finished)return;
  if(current)cellAt(current).classList.remove('current');
  activeCells.forEach(c=>c.classList.remove('current'));activeCells=[];
  if(visitIndex<result.visitedOrder.length){
    if(branching()){
      const wave=waves[waveIndex++];
      for(const event of wave){
        const cell=cellAt(event.current);cell.classList.remove('frontier','spreading');frontier.delete(key(event.current));cell.classList.add('visited','current');activeCells.push(cell);
        event.discovered.forEach(spread);visitIndex++;
      }
      current=wave.at(-1).current;
      $('current-cell').textContent=wave.length===1?`${current.row+1}, ${current.col+1}`:`${wave.length} branch tips`;
      status('Exploring',$('algorithm').value==='BFS'?`Distance ${wave[0].depth}: expanding ${wave.length} cells together. ${frontier.size} discovered cells form the next frontier.`:`Priority f = ${wave[0].priority}, distance g = ${wave[0].depth}: expanding ${wave.length} equally ranked cells. ${frontier.size} candidates remain open.`);
    }else{
    current=result.visitedOrder[visitIndex++];const cell=cellAt(current);cell.classList.add('visited','current');
    $('current-cell').textContent=`${current.row+1}, ${current.col+1}`;
    status('Exploring',`${$('algorithm').selectedOptions[0].textContent}: exploring cell (${current.row+1}, ${current.col+1}).`);
    }
    $('visited-count').textContent=visitIndex;$('coverage').textContent=Math.round(visitIndex/maze.flat().filter(x=>x===0).length*100)+'%';
    $('frontier-count').textContent=branching()?frontier.size:'—';
  }else if(pathIndex<result.path.length){
    current=result.path[pathIndex++];cellAt(current).classList.add('path','current');
    $('current-cell').textContent=`${current.row+1}, ${current.col+1}`;
    status('Tracing route','Following parent links from the search to highlight the route.');
  }
  if(visitIndex===result.visitedOrder.length&&pathIndex===result.path.length){
    running=false;finished=true;if(current)cellAt(current).classList.remove('current');
    activeCells.forEach(c=>c.classList.remove('current'));activeCells=[];
    $('path-count').textContent=result.path.length?`${result.path.length-1} moves`:'No route';
    status(result.path.length?'Route found':'No route',result.path.length?`Explored ${visitIndex} cells. Route: ${result.path.length-1} moves. ${$('algorithm').value==='DFS'?'DFS does not guarantee the shortest route.':'This is a shortest route on this grid.'}`:'All reachable cells were explored. The goal is blocked off; erase a wall or move a marker and try again.');
  }
  lock();
}
$('run').onclick=()=>{prepare();running=true;credit=0;lastTime=performance.now();lock();};
$('pause').onclick=()=>{running=!running;credit=0;lastTime=performance.now();lock();if(!running)status('Paused','Search paused. Inspect the board, change speed, or advance one step.');};
$('step').onclick=()=>{prepare();advance();if(!finished)$('phase').textContent='Paused';};
$('clear').onclick=clearSearch;
$('speed').oninput=playbackLabel;
$('route-speed').oninput=playbackLabel;
function explain(){
  const s=strategies[$('algorithm').value];$('algorithm-summary').textContent=s.summary;$('guarantee').textContent=s.guarantee;$('lesson-title').textContent=s.title;$('lesson-copy').textContent=s.copy;
  ['one','two','three'].forEach((n,i)=>$('lesson-'+n).textContent=s.steps[i]);
  playbackLabel();
  $('wave-note').textContent=$('algorithm').value==='BFS'?'BFS advances one distance layer at a time. At a junction, its wave splits into every open branch.':$('algorithm').value==='Astar'?'A* keeps several branches open. Only consecutive candidates with the same f and g animate together; it does not spread evenly like BFS.':'DFS explores one cell at a time, pursuing a branch before backtracking. It does not expand in distance waves.';
}
$('algorithm').onchange=()=>{clearSearch();explain();};
function newBoard(empty=false){maze=empty?Array.from({length:rows},()=>Array(cols).fill(0)):generateMaze(rows,cols);placeEndpoints();render();}
$('newMaze').onclick=()=>newBoard();
$('empty').onclick=()=>newBoard(true);
$('mazeSize').onchange=()=>{rows=cols=Number($('mazeSize').value);newBoard();};
function frame(time){
  if(running){
    // Store elapsed seconds, not wave credits: the route gets its own clock,
    // even when exploration finishes partway through this animation frame.
    credit+=Math.min((time-lastTime)/1000,.1);
    while(running){
      const interval=1/(visitIndex<result.visitedOrder.length?playbackRate():routeRate());
      if(credit<interval)break;
      credit-=interval;advance();
    }
  }
  lastTime=time;requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
placeEndpoints();render();explain();requestAnimationFrame(frame);
