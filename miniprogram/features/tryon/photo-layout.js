function photoLayout(imageWidth,imageHeight,windowWidth,windowHeight){
  const width=Math.max(1,windowWidth)
  const limit=Math.max(1,Math.round(windowHeight*.65))
  const scale=Math.min(width/imageWidth,limit/imageHeight)
  const fittedWidth=Math.max(1,Math.round(imageWidth*scale))
  const height=Math.max(1,Math.round(imageHeight*scale))
  return {width:fittedWidth,height,x:fittedWidth/2,y:height*.68,size:42,flatten:28}
}
module.exports={photoLayout}
