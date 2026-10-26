const $=id=>document.getElementById(id),tree=new BST(),svg=$('tree');
let steps=[],cursor=0,timer=null,working=false,playing=false,zoom=1,naturalWidth=600,naturalHeight=400,comparisons=0;
const depth=n=>n?1+Math.max(depth(n.left),depth(n.right)):0;
function status(phase,text){$('phase').textContent=phase;$('status').textContent=text;}
function controls(){['insertBtn','searchBtn','deleteBtn','bstInput','order','traverse','load','example'].forEach(id=>$(id).disabled=working);$('pause').disabled=!working;$('next').disabled=!working;$('pause').textContent=playing?'Pause':'Resume';}
function element(tag,attrs,parent,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function resize(){svg.style.width=`${naturalWidth*zoom}px`;svg.style.height=`${naturalHeight*zoom}px`;}
function draw(){
  svg.replaceChildren();const values=tree.traverse(),nodes=[];let rank=0;
  function layout(n,level){if(!n)return null;const left=layout(n.left,level+1),p={n,x:55+rank++*78,y:55+level*88};nodes.push(p);p.left=left;p.right=layout(n.right,level+1);return p;}
  layout(tree.root,0);naturalWidth=Math.max(320,values.length*78+32);naturalHeight=Math.max(250,depth(tree.root)*88+40);svg.setAttribute('viewBox',`0 0 ${naturalWidth} ${naturalHeight}`);svg.hidden=!tree.root;svg.style.display=tree.root?'block':'none';$('empty').hidden=!!tree.root;resize();
  nodes.forEach(p=>{for(const side of ['left','right']){const c=p[side];if(!c)continue;element('path',{class:'edge',d:`M ${p.x} ${p.y+23} L ${c.x} ${c.y-23}`},svg);element('text',{class:'edge-label',x:(p.x+c.x)/2+(side==='left'?-14:8),y:(p.y+c.y)/2},svg,side==='left'?'L':'R');}});
  nodes.forEach(p=>{const g=element('g',{class:'node',id:`node-${p.n.value}`,transform:`translate(${p.x} ${p.y})`,tabindex:0,role:'button','aria-label':`Value ${p.n.value}${p.n===tree.root?', root':''}. Select value.`},svg);element('circle',{r:24},g);element('text',{y:1},g,p.n.value);if(p.n===tree.root)element('text',{y:-35,class:'root-label'},g,'ROOT');const select=()=>{if(!working){$('bstInput').value=p.n.value;status('Selected',`Selected ${p.n.value}. Search, insert, or delete using the controls.`);}};g.onclick=select;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};});
  $('count').textContent=values.length;$('height').textContent=values.length?depth(tree.root)-1:'—';$('bounds').textContent=values.length?`${values[0]} / ${values.at(-1)}`:'—';
}
function highlight(value,tone='active'){
  svg.querySelectorAll('.node').forEach(n=>n.classList.remove('active','successor','found'));
  const el=$(`node-${value}`);if(el){el.classList.add(tone);const box=el.getBoundingClientRect(),view=$('tree-display').getBoundingClientRect();if(box.left<view.left||box.right>view.right||box.top<view.top||box.bottom>view.bottom)el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}
}
function advance(){
  if(!working)return;const step=steps[cursor++];step.apply?.();highlight(step.node,step.tone);if(step.compare)$('comparisons').textContent=++comparisons;
  status(step.phase||'Tracing',step.text);const li=document.createElement('li');li.textContent=step.text;$('trace').append(li);$('trace').scrollTop=$('trace').scrollHeight;
  if(cursor>=steps.length){working=false;playing=false;clearTimeout(timer);controls();}
}
function schedule(){clearTimeout(timer);if(working&&playing)timer=setTimeout(()=>{advance();schedule();},Number($('speed').value));}
function start(sequence){clearTimeout(timer);steps=sequence;cursor=0;working=true;playing=true;comparisons=0;$('comparisons').textContent='0';$('trace').replaceChildren();$('output').textContent='Run a traversal to reveal its visit order.';controls();advance();schedule();}
function lookup(value){const sequence=[];let n=tree.root;while(n){const equal=value===n.value;sequence.push({node:n.value,compare:true,text:equal?`${value} = ${n.value}: found the value.`:`${value} ${value<n.value?'<':'>'} ${n.value}: follow the ${value<n.value?'left':'right'} branch.`});if(equal)break;n=value<n.value?n.left:n.right;}return {sequence,node:n};}
function operate(kind){
  if(working||!$('bstInput').reportValidity())return;
  const value=Number($('bstInput').value);if(!Number.isInteger(value)||value< -999||value>999)return;
  const {sequence,node}=lookup(value);
  if(kind==='search')sequence.push({node:node?.value,tone:'found',phase:node?'Found':'Not found',text:node?`${value} is in the tree.`:`Reached an empty branch. ${value} is not in the tree.`});
  if(kind==='insert'){
    if(node)sequence.push({node:value,phase:'Duplicate',text:`${value} already exists. This BST stores unique values; no node was added.`});
    else if(tree.traverse().length>=63){status('Tree full','The visualizer supports 63 nodes. Delete a node before inserting another.');return;}
    else sequence.push({node:value,tone:'found',phase:'Inserted',text:`Insert ${value} at the empty ${tree.root?'branch':'root'}. The BST ordering is preserved.`,apply:()=>{tree.insert(value);draw();}});
  }
  if(kind==='delete'){
    if(!node)sequence.push({phase:'Not found',text:`${value} is not in the tree. Nothing was deleted.`});
    else{
      let replacement=node.left||node.right;
      if(node.left&&node.right){sequence.push({node:value,text:`${value} has two children. Find the smallest value in its right subtree.`});let s=node.right;while(s){sequence.push({node:s.value,tone:'successor',text:s.left?`Successor search: ${s.value} has a left child; continue left.`:`${s.value} has no left child. It is the inorder successor.`});if(!s.left)break;s=s.left;}replacement=s;}
      const text=node.left&&node.right?`Replace ${value} with successor ${replacement.value}, then remove the successor from its old position.`:replacement?`${value} has one child. Promote ${replacement.value} into its place.`:`${value} is a leaf. Remove it directly.`;
      sequence.push({node:replacement?.value,tone:'found',phase:'Deleted',text,apply:()=>{tree.remove(value);draw();}});
    }
  }
  start(sequence);
}
$('value-form').onsubmit=e=>{e.preventDefault();operate('insert');};$('searchBtn').onclick=()=>operate('search');$('deleteBtn').onclick=()=>operate('delete');
$('pause').onclick=()=>{playing=!playing;controls();if(playing)schedule();else{clearTimeout(timer);$('phase').textContent='Paused';}};
$('next').onclick=()=>{clearTimeout(timer);playing=false;advance();controls();};
$('speed').oninput=()=>{$('speed-value').textContent=`${$('speed').value} ms`;schedule();};
$('traverse').onclick=()=>{if(working)return;const order=$('order').value,values=tree.traverse(order);if(!values.length){status('Empty tree','Insert a value before traversing.');return;}const sequence=values.map((v,i)=>({node:v,text:`${order}: visit ${v} (${i+1} of ${values.length}).`,apply:()=>{if(i===0)$('output').replaceChildren();const chip=document.createElement('span');chip.textContent=v;$('output').append(chip);}}));sequence.push({phase:'Complete',text:`${order} traversal complete.${order==='inorder'?' Values are in ascending order.':''}`});start(sequence);};
function reset(){clearTimeout(timer);working=false;playing=false;steps=[];cursor=0;tree.root=null;comparisons=0;$('comparisons').textContent='0';$('trace').replaceChildren();$('output').textContent='Run a traversal to reveal its visit order.';controls();draw();status('Ready','Tree cleared. Insert a value to create a root.');}
function fit(){zoom=Math.min(1,Math.max(.1,($('tree-display').clientWidth-20)/naturalWidth));resize();$('tree-display').scrollTop=0;$('tree-display').scrollLeft=0;}
function load(){reset();let values=$('example').value==='skewed'?[10,20,30,40,50,60,70]:[50,30,70,20,40,60,80];if($('example').value==='random'){const unique=new Set();while(unique.size<9)unique.add(Math.floor(Math.random()*199)-99);values=[...unique];}values.forEach(v=>tree.insert(v));draw();fit();status('Ready',`Loaded ${$('example').selectedOptions[0].textContent.toLowerCase()}. Try inserting 45, searching for a value, or tracing a deletion.`);}
$('load').onclick=load;$('reset').onclick=reset;$('zoom-in').onclick=()=>{zoom=Math.min(2,zoom*1.2);resize();};$('zoom-out').onclick=()=>{zoom=Math.max(.1,zoom/1.2);resize();};$('fit').onclick=fit;
load();
