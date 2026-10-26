const $ = id => document.getElementById(id);
const example = ['app','apple','apt','bat','bath','car','care','cat','do','dog','dot'];
let trie, words, full = false, timer = null, traceIndex = 0, selected = '', loadVersion = 0;
const prefix = () => $('searchBox').value.trim().toLowerCase();
function stop(){clearTimeout(timer);timer=null;$('play').textContent='Replay search';}
function reset(){stop();loadVersion++;trie=new Trie();words=new Set(example);words.forEach(w=>trie.add(w));full=false;selected='';$('searchBox').value='ca';$('load').disabled=false;$('load-status').textContent='The example opens directly from disk. If your browser blocks the full dictionary, serve the project over HTTP.';$('insert-status').textContent='';refresh();}
function svgElement(tag,attrs,parent,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;}
function renderTree(){
  const query=prefix(), reached=query.slice(0,traceIndex), exists=!!trie.findPrefix(reached);
  const results=trie.autocomplete(query,Number($('limitSelect').value));
  let visibleTrie=trie;
  if(full){
    visibleTrie=new Trie();results.forEach(w=>visibleTrie.add(w));let current=trie.root,path='';
    for(const char of query){if(!current.children.has(char))break;path+=char;current=current.children.get(char);visibleTrie.add(path);}
    // Search-path nodes must retain their actual word-ending flags.
    let n=visibleTrie.root,p='';n.isWord=trie.root.isWord;
    for(const char of query){if(!n.children.has(char))break;n=n.children.get(char);p+=char;n.isWord=trie.findPrefix(p).isWord;}
  }
  const nodes=[],edges=[];let leaf=0,maxDepth=0;
  function layout(node,path,depth){const item={node,path,depth,x:0,y:48+depth*82};nodes.push(item);maxDepth=Math.max(maxDepth,depth);const children=[...node.children].sort(([a],[b])=>a.localeCompare(b));const childItems=children.map(([c,n])=>layout(n,path+c,depth+1));item.x=childItems.length?(childItems[0].x+childItems.at(-1).x)/2:48+leaf++*76;childItems.forEach(c=>edges.push([item,c]));return item;}
  layout(visibleTrie.root,'',0);
  if(full) nodes.forEach(n=>{n.node.isWord=trie.findPrefix(n.path).isWord;});
  const svg=$('tree');svg.replaceChildren();const w=Math.max(360,leaf*76+20),h=maxDepth*82+110;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.width=`${w}px`;
  svgElement('title',{id:'tree-title'},svg,'Trie character tree');svgElement('desc',{id:'tree-desc'},svg,`Root at the top, one character per level. Double circles mark complete words. ${full?'Only displayed result paths are shown.':'All example dictionary words are shown.'}`);
  function state(path){if(reached.startsWith(path)&&path.length<=traceIndex)return 'path';if(exists&&traceIndex===query.length&&path.startsWith(query))return 'match';return '';}
  edges.forEach(([a,b])=>svgElement('path',{d:`M ${a.x} ${a.y+19} C ${a.x} ${a.y+48}, ${b.x} ${b.y-48}, ${b.x} ${b.y-19}`,class:`edge ${state(b.path)}`},svg));
  nodes.forEach(n=>{const g=svgElement('g',{class:`node ${state(n.path)} ${selected&&selected.startsWith(n.path)?'selected':''}`},svg);svgElement('title',{},g,n.path?`Prefix: ${n.path}${n.node.isWord?' â€” complete word':''}`:'Root: empty prefix');svgElement('circle',{cx:n.x,cy:n.y,r:20},g);if(n.node.isWord)svgElement('circle',{cx:n.x,cy:n.y,r:16},g);svgElement('text',{x:n.x,y:n.y},g,n.path?n.path.at(-1):'âˆ…');if(n.node.isWord)svgElement('text',{x:n.x,y:n.y+32,class:'word-label'},g,n.path);});
  $('diagram-note').textContent=full?'Focused view: only the search path and displayed completion paths are drawn. Other dictionary branches are omitted.':'Entire learning trie shown. Scroll horizontally on smaller screens. âˆ… is the empty root; a double ring marks a stored word.';
  $('dataset').textContent=`${full?'Full':'Learning'} dictionary Â· ${words.size.toLocaleString()} words`;
}
function renderTrace(){const q=prefix(),crumbs=$('breadcrumbs');crumbs.replaceChildren();const root=document.createElement('span');root.textContent='root';root.className='active';crumbs.append(root);let matched=0;for(let i=0;i<q.length;i++){const el=document.createElement('span');el.textContent=q[i];const exists=!!trie.findPrefix(q.slice(0,i+1));if(i<traceIndex){el.className=exists?'active':'missing';if(exists)matched++;}crumbs.append(el);}
  if(!q)$('status').textContent='At the root. Every word is below this node. Type a prefix to follow its character edges.';
  else if(traceIndex<q.length)$('status').textContent=`Matched ${traceIndex} of ${q.length} characters. Next, look for the â€œ${q[traceIndex]}â€ edge.`;
  else if(matched<q.length)$('status').textContent=`No â€œ${q[matched]}â€ edge after ${matched?`â€œ${q.slice(0,matched)}â€`:'the root'}. Search stops here; this prefix has no completions.`;
  else $('status').textContent=`Followed ${q.length} character edges to â€œ${q}â€. ${trie.findPrefix(q).isWord?'This node is already a complete word. ':''}Collect the word endings in the green subtree below it.`;
}
function renderSuggestions(){const q=prefix(),limit=Number($('limitSelect').value),matches=trie.autocomplete(q,limit+1);$('suggestions').replaceChildren();matches.slice(0,limit).forEach(word=>{const li=document.createElement('li'),button=document.createElement('button'),label=document.createElement('span'),b=document.createElement('b'),small=document.createElement('small');b.textContent=word.slice(0,q.length);label.append(b,document.createTextNode(word.slice(q.length)));small.textContent='trace â†—';button.append(label,small);button.onclick=()=>{stop();selected=word;traceIndex=q.length;renderTree();renderTrace();$('status').textContent=`Word path: root â†’ ${[...word].join(' â†’ ')}. The double ring at â€œ${word}â€ marks its ending.`;};li.append(button);$('suggestions').append(li);});$('result-note').textContent=matches.length?`${matches.length>limit?`Showing first ${limit}`:`${matches.length} completion${matches.length===1?'':'s'}`} ${q?`for â€œ${q}â€`:'from the root'}. Select one to outline its path.`:'No completions. Try another prefix or insert this word.';}
function refresh(){stop();selected='';traceIndex=prefix().length;renderSuggestions();renderTree();renderTrace();$('word-bank').replaceChildren();[...words].slice(0,full?20:60).sort().forEach(w=>{const chip=document.createElement('span');chip.textContent=w;$('word-bank').append(chip);});if(full){const note=document.createElement('span');note.textContent='â€¦ dictionary preview';$('word-bank').append(note);}}
function next(){const q=prefix();if(traceIndex>=q.length)traceIndex=0;else traceIndex++;if(!trie.findPrefix(q.slice(0,traceIndex)))traceIndex=q.length;selected='';renderTree();renderTrace();}
$('searchBox').oninput=refresh;$('limitSelect').onchange=refresh;
document.querySelectorAll('[data-prefix]').forEach(b=>b.onclick=()=>{$('searchBox').value=b.dataset.prefix;refresh();});
$('next').onclick=()=>{stop();next();};
$('play').onclick=()=>{if(timer){stop();return;}traceIndex=0;selected='';renderTree();renderTrace();if(!prefix())return;$('play').textContent='Pause trace';function tick(){next();if(traceIndex<prefix().length)timer=setTimeout(tick,Number($('speed').value));else stop();}timer=setTimeout(tick,Number($('speed').value));};
$('speed').oninput=()=>{$('speed-label').textContent=`${$('speed').value} ms`;};
$('insert-form').onsubmit=e=>{e.preventDefault();const word=$('new-word').value.trim().toLowerCase();if(!/^[a-z]{1,24}$/.test(word))return;let reused=0;while(reused<word.length&&trie.findPrefix(word.slice(0,reused+1)))reused++;const added=trie.add(word);words.add(word);$('searchBox').value=word;refresh();$('insert-status').textContent=added?`Inserted â€œ${word}â€: reused ${reused} character nodes, added ${word.length-reused}. Its last node is now marked as a word ending.`:`â€œ${word}â€ is already stored. No nodes were added.`;$('new-word').value='';};
$('reset').onclick=reset;
$('load').onclick=async()=>{const version=++loadVersion;$('load').disabled=true;$('load-status').textContent='Loading dictionaryâ€¦';try{const response=await fetch('words.txt');if(!response.ok)throw new Error('Dictionary request failed');const list=(await response.text()).split(/\r?\n/),nextTrie=new Trie(),nextWords=new Set(words);for(let i=0;i<list.length;i++){const word=list[i].trim().toLowerCase();if(/^[a-z]+$/.test(word))nextWords.add(word);if(i%10000===0){await new Promise(resolve=>setTimeout(resolve,0));if(version!==loadVersion)return;}}let i=0;for(const word of nextWords){nextTrie.add(word);if(++i%5000===0){await new Promise(resolve=>setTimeout(resolve,0));if(version!==loadVersion)return;}}words.forEach(word=>{nextTrie.add(word);nextWords.add(word);});trie=nextTrie;words=nextWords;full=true;refresh();$('load-status').textContent=`Loaded ${words.size.toLocaleString()} words. Diagram shows a limited view so it stays readable.`;
  }catch(error){if(version!==loadVersion)return;$('load-status').textContent='Could not load the full dictionary. Serve the project over HTTP and retry. The learning trie remains available.';$('load').disabled=false;}};
reset();

