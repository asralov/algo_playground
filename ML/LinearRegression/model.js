const Regression={
  metrics(points,m,b){if(!points.length)return {mse:null,rmse:null,r2:null};const mean=points.reduce((s,p)=>s+p.y,0)/points.length,sse=points.reduce((s,p)=>s+(m*p.x+b-p.y)**2,0),sst=points.reduce((s,p)=>s+(p.y-mean)**2,0),mse=sse/points.length;return {mse,rmse:Math.sqrt(mse),r2:sst>1e-12?1-sse/sst:null};},
  step(points,m,b,rate){let dm=0,db=0;for(const p of points){const error=m*p.x+b-p.y;dm+=2*error*p.x;db+=2*error;}return {m:m-rate*dm/points.length,b:b-rate*db/points.length};},
  fit(points){if(points.length<2)return null;const x=points.reduce((s,p)=>s+p.x,0)/points.length,y=points.reduce((s,p)=>s+p.y,0)/points.length,variance=points.reduce((s,p)=>s+(p.x-x)**2,0);if(variance<1e-12)return null;const m=points.reduce((s,p)=>s+(p.x-x)*(p.y-y),0)/variance;return {m,b:y-m*x};}
};
if(typeof module!=='undefined')module.exports=Regression;
