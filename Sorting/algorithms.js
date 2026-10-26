// Pure, replayable snapshots. Stable IDs keep equal-valued bars distinguishable.
function sortingFrames(values, algorithm) {
  const a=values.map((value,id)=>({value,id})),frames=[],fixed=new Set();let comparisons=0,swaps=0;
  function emit(text,line,active=[],kind='compare',pivot=-1){frames.push({items:a.slice(),fixed:[...fixed],active,kind,pivot,text,line,comparisons,swaps});}
  function compare(i,j,line,pivot=-1){comparisons++;emit(`Compare ${a[i].value} at index ${i} with ${a[j].value} at index ${j}.`,line,[i,j],'compare',pivot);}
  function swap(i,j,line,pivot=-1){if(i===j)return;const x=a[i].value,y=a[j].value;[a[i],a[j]]=[a[j],a[i]];swaps++;emit(`Swap ${x} and ${y} at indices ${i} and ${j}.`,line,[i,j],'swap',pivot);}
  emit('Ready. Values will be sorted from smallest to largest.',-1,[],'ready');
  if(algorithm==='bubble'){
    for(let end=a.length-1;end>0;end--){let changed=false;for(let j=0;j<end;j++){compare(j,j+1,1);if(a[j].value>a[j+1].value){swap(j,j+1,2);changed=true;}}fixed.add(end);emit(`${a[end].value} is in its final position.`,3,[],'fixed');if(!changed){emit('No swaps in this pass: the remaining prefix is already sorted.',4,[],'fixed');break;}}
  }else if(algorithm==='selection'){
    for(let i=0;i<a.length-1;i++){let min=i;emit(`Find the smallest value from index ${i} onward.`,0,[min],'key');for(let j=i+1;j<a.length;j++){compare(j,min,1);if(a[j].value<a[min].value){min=j;emit(`New minimum: ${a[min].value} at index ${min}.`,2,[min],'key');}}swap(i,min,3);fixed.add(i);emit(`${a[i].value} is now fixed at index ${i}.`,4,[],'fixed');}
  }else if(algorithm==='insertion'){
    for(let i=1;i<a.length;i++){emit(`Insert ${a[i].value} into the sorted prefix before index ${i}.`,0,[i],'key');let j=i;while(j>0){compare(j-1,j,1);if(a[j-1].value<=a[j].value)break;swap(j-1,j,2);j--;}emit(`Indices 0 through ${i} are sorted relative to each other; they may still move.`,3,[],'prefix');}
  }else if(algorithm==='quick'){
    function quick(lo,hi){if(lo>hi)return;if(lo===hi){fixed.add(lo);return;}const pivot=a[hi].value;emit(`Partition indices ${lo}–${hi} around pivot ${pivot}.`,0,[],'key',hi);let boundary=lo;for(let j=lo;j<hi;j++){compare(j,hi,1,hi);if(a[j].value<pivot){swap(boundary,j,2,hi);boundary++;}}swap(boundary,hi,3,boundary);fixed.add(boundary);emit(`Pivot ${pivot} is fixed at index ${boundary}. Sort both partitions next.`,4,[],'fixed',boundary);quick(lo,boundary-1);quick(boundary+1,hi);}
    quick(0,a.length-1);
  }else throw new Error('Unknown sorting algorithm');
  a.forEach((_,i)=>fixed.add(i));emit('Sorted. Every value is in its final position.',-1,[],'done');return frames;
}
if(typeof module!=='undefined')module.exports={sortingFrames};
