const $ = id => document.getElementById(id);
const myStack = new Stack();
const list = $('visualStack');
let busy = false, operationCount = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function message(phase,text){$('phase').textContent=phase;$('status').textContent=text;}
function lock(value){busy=value;['pushButton','popButton','peekButton','demo','clear','stackInput'].forEach(id=>$(id).disabled=value);}
function update(){
  const size=myStack.stack.length,[exists,top]=myStack.peek();
  $('size').textContent=`${size} ${size===1?'item':'items'}`;$('top-value').textContent=exists?top:'—';$('top-index').textContent=exists?size-1:'—';$('state').textContent=exists?'Has items':'Empty';$('empty-state').hidden=exists;
  [...list.children].forEach((el,i)=>{el.classList.toggle('top',i===0);el.querySelector('.top-label').textContent=i===0?'TOP':'';el.setAttribute('aria-label',`${i===0?'Top, ':''}index ${size-1-i}: ${myStack.stack[size-1-i]}`);});
}
function record(kind,value){
  operationCount++;const li=document.createElement('li'),code=document.createElement('code'),note=document.createElement('small');
  if(kind==='pop')li.className='pop-record';
  code.textContent=kind==='push'?`push(${value})`:`${kind}() → ${value}`;note.textContent=`#${operationCount} · size ${myStack.stack.length}`;li.append(code,note);$('history').prepend(li);while($('history').children.length>8)$('history').lastElementChild.remove();$('history-empty').hidden=true;
}
async function animate(el,keyframes){
  const motion=el.animate(keyframes,{duration:reducedMotion.matches?0:600/(Number($('speed').value)/100),easing:'cubic-bezier(.22,.75,.25,1)',fill:'both'});
  try{await motion.finished;}finally{motion.cancel();}
}
async function perform(kind,value){
  if(kind==='push'){
    myStack.push(value);const el=document.createElement('li');el.className='stack-item';const index=document.createElement('span'),content=document.createElement('span'),label=document.createElement('span');index.className='index';index.textContent=`[${myStack.stack.length-1}]`;content.className='value';content.textContent=value;label.className='top-label';el.append(index,content,label);list.prepend(el);update();$('stack-scroll').scrollTop=0;message('Pushing',`Placing “${value}” above the previous top.`);
    await animate(el,[{transform:'translateY(-65px) scale(.94)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}]);record(kind,value);message('Pushed',`“${value}” is now on top, at index ${myStack.stack.length-1}. It will be the next value removed.`);
  }else{
    const [exists,top]=myStack.peek();if(!exists){message('Empty stack',`${kind==='pop'?'Pop':'Peek'} needs a top item. Push a value first; the empty stack stays unchanged.`);return;}
    const el=list.firstElementChild;$('stack-scroll').scrollTop=0;
    if(kind==='pop'){
      message('Popping',`Removing the newest value, “${top}”, from the top.`);
      await animate(el,[{transform:'translate(0,0)',opacity:1},{transform:'translate(35px,-65px)',opacity:0}]);myStack.pop();el.remove();update();message('Popped',`Returned “${top}”. ${myStack.empty()?'The stack is now empty.':`“${myStack.peek()[1]}” is the new top.`}`);
    }else{
      message('Peeking',`Reading “${top}” without removing it.`);
      await animate(el,[{boxShadow:'0 0 0 0 #d9ab49'},{boxShadow:'0 0 0 6px #d9ab4966',offset:.5},{boxShadow:'0 0 0 0 #d9ab49'}]);message('Peeked',`Top value: “${top}”. Size and order are unchanged.`);
    }
    $('returned').textContent=top;record(kind,top);
  }
}
async function operate(kind,value){if(busy)return;lock(true);try{await perform(kind,value);}finally{lock(false);}}
function clear(){myStack.stack.length=0;list.replaceChildren();$('history').replaceChildren();$('history-empty').hidden=false;$('returned').textContent='—';operationCount=0;update();message('Ready','Stack cleared. Push a value to begin again.');}
$('push-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const value=$('stackInput').value.trim();if(!value){message('Enter a value','Use at least one non-space character to push an item.');$('stackInput').focus();return;}await operate('push',value);$('stackInput').value='';$('stackInput').focus();};
$('popButton').onclick=()=>operate('pop');$('peekButton').onclick=()=>operate('peek');$('clear').onclick=()=>{if(!busy)clear();};
$('speed').oninput=()=>{$('speed-value').textContent=`${Number($('speed').value)/100}×`;};
$('demo').onclick=async()=>{if(busy)return;lock(true);try{clear();for(const value of ['A','B','C'])await perform('push',value);await perform('peek');for(let i=0;i<3;i++)await perform('pop');message('Demo complete','Pushed A → B → C. Popped C → B → A. Last in, first out.');}finally{lock(false);}};
update();
