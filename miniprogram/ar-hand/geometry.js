// Model coordinates and displayed camera pixels share the same center-cropped frame.
function placement(points, fw, fh, width, height) {
 if(!Array.isArray(points)||points.length!==21||![fw,fh,width,height].every(v=>v>0))return null;
 const [w,i,p]=[points[0],points[5],points[17]];
 if(![w,i,p].every(v=>v&&v.slice(0,3).every(Number.isFinite)))return null;
 const scale=Math.max(width/fw,height/fh), dx=(width-fw*scale)/2,dy=(height-fh*scale)/2;
 const mx=(i[0]+p[0])/2,my=(i[1]+p[1])/2;
 const vx=mx-w[0],vy=my-w[1],length=Math.hypot(vx,vy);
 const palm=Math.hypot(i[0]-p[0],i[1]-p[1]);
 if(length<3||palm<3)return null;
 return {x:(w[0]-vx*.16)*scale+dx,y:(w[1]-vy*.16)*scale+dy,
  size:Math.min(85,Math.max(5,palm*1.15*scale/width*100)),
  // Existing renderer tilts around Y: its short axis follows the forearm.
  angle:Math.atan2(vy,vx)*180/Math.PI,tilt:45};
}
module.exports={placement};

function smooth(previous,next){
 if(!previous)return next;
 const k=.55,delta=((next.angle-previous.angle+540)%360)-180;
 return {...next,x:previous.x+(next.x-previous.x)*k,y:previous.y+(next.y-previous.y)*k,size:previous.size+(next.size-previous.size)*k,angle:previous.angle+delta*k};
}
module.exports.smooth=smooth;
