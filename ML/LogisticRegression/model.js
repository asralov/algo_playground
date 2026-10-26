const Logistic={
  sigmoid(z){return z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));},
  predict(p,w){return this.sigmoid(w.x*p.x+w.y*p.y+w.b);},
  metrics(points,w,threshold=.5){if(!points.length)return {loss:null,accuracy:null,tn:0,fp:0,fn:0,tp:0};let loss=0,tn=0,fp=0,fn=0,tp=0;for(const p of points){const z=w.x*p.x+w.y*p.y+w.b;loss+=Math.max(z,0)-p.label*z+Math.log1p(Math.exp(-Math.abs(z)));const predicted=this.sigmoid(z)>=threshold;if(p.label===1){if(predicted)tp++;else fn++;}else if(predicted)fp++;else tn++;}return {loss:loss/points.length,accuracy:(tp+tn)/points.length,tn,fp,fn,tp};},
  step(points,w,rate){let x=0,y=0,b=0;for(const p of points){const e=this.predict(p,w)-p.label;x+=e*p.x;y+=e*p.y;b+=e;}return {x:w.x-rate*x/points.length,y:w.y-rate*y/points.length,b:w.b-rate*b/points.length};},
  boundary(w,threshold){const z=Math.log(threshold/(1-threshold)),hits=[];const add=(x,y)=>{if(x>=-1e-9&&x<=1+1e-9&&y>=-1e-9&&y<=1+1e-9&&!hits.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<1e-8))hits.push({x,y});};if(Math.abs(w.y)>1e-12){add(0,(z-w.b)/w.y);add(1,(z-w.b-w.x)/w.y);}if(Math.abs(w.x)>1e-12){add((z-w.b)/w.x,0);add((z-w.b-w.y)/w.x,1);}return hits.length>=2?hits.slice(0,2):null;}
};
if(typeof module!=='undefined')module.exports=Logistic;
