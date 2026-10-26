function mergeFrames(values){
  const nodes=[],state={},frames=[];let comparisons=0,writes=0,splits=0;
  function build(items,start,depth,parent=null){const id=nodes.length,n={id,items,start,depth,parent,left:null,right:null};nodes.push(n);state[id]={visible:false,status:'waiting',data:items};if(items.length>1){const mid=Math.floor(items.length/2);n.left=build(items.slice(0,mid),start,depth+1,id);n.right=build(items.slice(mid),start+mid,depth+1,id);}return id;}
  build(values.map((value,id)=>({value,id})),0,0);
  const emit=(phase,text,active,detail=null,move=null)=>frames.push({phase,text,active,detail,move,comparisons,writes,splits,state:JSON.parse(JSON.stringify(state))});
  state[0].visible=true;emit('Ready','Begin with one unsorted array. Divide until every group contains one value.',0);
  // Show the complete division before conquering bottom-up, to make the two ideas explicit.
  for(const n of [...nodes].sort((a,b)=>a.depth-b.depth||a.start-b.start)){
    if(n.left===null){state[n.id].status='sorted';continue;}
    state[n.id].status='divided';state[n.left].visible=state[n.right].visible=true;splits++;
    emit('Divide',`Split ${n.items.length} values into ${nodes[n.left].items.length} on the left and ${nodes[n.right].items.length} on the right.`,n.id);
  }
  emit('Base case','Every one-value group is already sorted. Now combine sorted groups, working upward.',0);
  function conquer(id){const n=nodes[id];if(n.left===null)return state[id].data;const left=conquer(n.left),right=conquer(n.right),output=[];let i=0,j=0;state[id].status='merging';state[id].data=[];
    const detail=()=>({left,right,i,j,output:output.slice()});
    emit('Merge',`Merge two sorted groups of ${left.length} and ${right.length} values.`,id,detail());
    while(i<left.length||j<right.length){let takeLeft;
      if(i<left.length&&j<right.length){comparisons++;emit('Compare',`Compare ${left[i].value} and ${right[j].value}. ${left[i].value===right[j].value?'Equal: take the left value first to preserve stability.':'Take the smaller front value.'}`,id,detail());takeLeft=left[i].value<=right[j].value;}
      else takeLeft=i<left.length;
      const from=takeLeft?n.left:n.right,fromIndex=takeLeft?i:j,item=takeLeft?left[i++]:right[j++];output.push(item);writes++;state[id].data=output.slice();
      emit('Place',`Place ${item.value} into output slot ${output.length-1}.${i===left.length||j===right.length?' An input is exhausted; remaining values can be copied in order.':''}`,id,detail(),{from,fromIndex,to:id,toIndex:output.length-1,item});
    }
    state[id].status='sorted';emit('Conquered',`This group of ${output.length} values is sorted and ready for its parent.`,id,detail());return output;
  }
  conquer(0);emit('Sorted','All groups have merged back into one sorted array. Divide and conquer is complete.',0);
  return {nodes,frames};
}
if(typeof module!=='undefined')module.exports={mergeFrames};
