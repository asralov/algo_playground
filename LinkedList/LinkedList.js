class LinkedList {
  constructor(){this.head=null;this.tail=null;this.size=0;this.nextId=1;}
  nodes(){const result=[];for(let n=this.head;n;n=n.next)result.push(n);return result;}
  at(index){if(!Number.isInteger(index)||index<0||index>=this.size)return null;let node=this.head;while(index-->0)node=node.next;return node;}
  insert(index,value){
    if(!Number.isInteger(index)||index<0||index>this.size)throw new RangeError('Invalid insertion index');
    const node={id:this.nextId++,value,next:null};
    if(index===0){node.next=this.head;this.head=node;}else{const previous=index===this.size?this.tail:this.at(index-1);node.next=previous.next;previous.next=node;}
    if(index===this.size)this.tail=node;this.size++;return node;
  }
  remove(index){
    if(!Number.isInteger(index)||index<0||index>=this.size)throw new RangeError('Invalid removal index');
    let removed;if(index===0){removed=this.head;this.head=removed.next;}else{const previous=this.at(index-1);removed=previous.next;previous.next=removed.next;if(removed===this.tail)this.tail=previous;}
    this.size--;if(!this.size)this.tail=null;removed.next=null;return removed;
  }
}
if(typeof module!=='undefined')module.exports={LinkedList};
