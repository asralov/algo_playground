class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  find(value) { let n=this.root; while(n&&n.value!==value)n=value<n.value?n.left:n.right; return n; }
  insert(value) {
    if(!this.root){this.root=new Node(value);return true;}
    let n=this.root;
    while(n){if(n.value===value)return false;const side=value<n.value?'left':'right';if(!n[side]){n[side]=new Node(value);return true;}n=n[side];}
  }
  remove(value) {
    if(!this.find(value))return false;
    function remove(n,v){
      if(v<n.value)n.left=remove(n.left,v);else if(v>n.value)n.right=remove(n.right,v);
      else{if(!n.left)return n.right;if(!n.right)return n.left;let s=n.right;while(s.left)s=s.left;n.value=s.value;n.right=remove(n.right,s.value);}return n;
    }
    this.root=remove(this.root,value);return true;
  }
  traverse(order='inorder') {
    const values=[];
    function visit(n){if(!n)return;if(order==='preorder')values.push(n.value);visit(n.left);if(order==='inorder')values.push(n.value);visit(n.right);if(order==='postorder')values.push(n.value);}
    visit(this.root);return values;
  }
}

if(typeof module!=='undefined')module.exports={BST,Node};
