const $=id=>document.getElementById(id);
const myQueue=new Queue(),list=$('visualQueue'),scroller=$('queue-scroll');
let busy=false,operationCount=0,arrivalCount=0;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function message(phase,text){$('phase').textContent=phase;$('status').textContent=text;}
function lock(value){busy=value;['enqueueButton','dequeueButton','peekButton','demo','clear','queueInput'].forEach(id=>$(id).disabled=value);}
function update(){
  const size=myQueue.items.length,exists=!myQueue.isEmpty();$('size').textContent=`${size} ${size===1?'item':'items'}`;$('front-value').textContent=exists?myQueue.peek()[1]:'—';$('rear-value').textContent=exists?myQueue.items[size-1]:'—';$('state').textContent=exists?'Has items':'Empty';$('empty-state').hidden=exists;
  [...list.children].forEach((el,i)=>{el.classList.toggle('front',i===0);el.classList.toggle('rear',i===size-1);el.querySelector('.end-label').textContent=size===1?'FRONT + REAR':i===0?'FRONT':i===size-1?'REAR':'WAITING';el.querySelector('.position').textContent=`position ${i}`;el.setAttribute('aria-label',`${i===0?'Front, ':''}${i===size-1?'rear, ':''}position ${i}: ${myQueue.items[i]}`);});
}
function record(kind,value){operationCount++;const li=document.createElement('li'),code=document.createElement('code'),note=document.createElement('small');if(kind==='dequeue')li.className='dequeue-record';code.textContent=kind==='enqueue'?`enqueue(${value})`:`${kind}() → ${value}`;note.textContent=`#${operationCount} · size ${myQueue.items.length}`;li.append(code,note);$('history').prepend(li);while($('history').children.length>8)$('history').lastElementChild.remove();$('history-empty').hidden=true;}
async function animate(el,frames){const motion=el.animate(frames,{duration:reducedMotion.matches?0:600/(Number($('speed').value)/100),easing:'cubic-bezier(.22,.75,.25,1)',fill:'both'});try{await motion.finished;}finally{motion.cancel();}}
async function perform(kind,value){
  if(kind==='enqueue'){
    myQueue.enqueue(value);const el=document.createElement('li');el.className='queue-item';for(const [cls,text] of [['arrival',`arrival #${++arrivalCount}`],['queue-value',value],['end-label',''],['position','']]){const span=document.createElement('span');span.className=cls;span.textContent=text;el.append(span);}list.append(el);update();scroller.scrollLeft=scroller.scrollWidth;message('Enqueuing',`“${value}” joins at the rear, behind all earlier arrivals.`);
    await animate(el,[{transform:'translateX(55px)',opacity:0},{transform:'translateX(0)',opacity:1}]);record(kind,value);message('Enqueued',`“${value}” is at the rear. “${myQueue.peek()[1]}” will leave next.`);
  }else{
    const [exists,front]=myQueue.peek();if(!exists){message('Empty queue',`${kind==='dequeue'?'Dequeue':'Peek'} needs a front item. Enqueue a value first; nothing was removed.`);return;}const el=list.firstElementChild;scroller.scrollLeft=0;
    if(kind==='dequeue'){
      message('Dequeuing',`Serving the oldest value, “${front}”, at the front.`);await animate(el,[{transform:'translateX(0)',opacity:1},{transform:'translateX(-55px)',opacity:0}]);
      const remaining=[...list.children].slice(1),positions=remaining.map(item=>item.getBoundingClientRect().left);myQueue.dequeue();el.remove();update();
      // Keep the remaining values visually in place, then ease them toward the front.
      await Promise.all(remaining.map((item,i)=>animate(item,[{transform:`translateX(${positions[i]-item.getBoundingClientRect().left}px)`},{transform:'translateX(0)'}])));
      message('Dequeued',`Returned “${front}”. ${myQueue.isEmpty()?'The queue is now empty.':`“${myQueue.peek()[1]}” is next at the front.`}`);
    }else{
      message('Peeking',`Reading “${front}” without removing it.`);await animate(el,[{boxShadow:'0 0 0 0 #d9ab49'},{boxShadow:'0 0 0 6px #d9ab4966',offset:.5},{boxShadow:'0 0 0 0 #d9ab49'}]);message('Peeked',`Front value: “${front}”. Size and arrival order are unchanged.`);
    }
    $('returned').textContent=front;record(kind,front);
  }
}
async function operate(kind,value){if(busy)return;lock(true);try{await perform(kind,value);}finally{lock(false);}}
function clear(){myQueue.items.length=0;list.replaceChildren();$('history').replaceChildren();$('history-empty').hidden=false;$('returned').textContent='—';operationCount=0;arrivalCount=0;update();message('Ready','Queue cleared. Enqueue a value to begin again.');}
$('enqueue-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const value=$('queueInput').value.trim();if(!value){message('Enter a value','Use at least one non-space character to enqueue an item.');$('queueInput').focus();return;}await operate('enqueue',value);$('queueInput').value='';$('queueInput').focus();};
$('dequeueButton').onclick=()=>operate('dequeue');$('peekButton').onclick=()=>operate('peek');$('clear').onclick=()=>{if(!busy)clear();};$('speed').oninput=()=>{$('speed-value').textContent=`${Number($('speed').value)/100}×`;};
$('demo').onclick=async()=>{if(busy)return;lock(true);try{clear();for(const value of ['A','B','C'])await perform('enqueue',value);await perform('peek');for(let i=0;i<3;i++)await perform('dequeue');message('Demo complete','Enqueued A → B → C. Dequeued A → B → C. First in, first out.');}finally{lock(false);}};
update();
