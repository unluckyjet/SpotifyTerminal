export function coverEnergy(pixels:Buffer){
  let luma=0,sat=0,n=0;
  for(let i=0;i+2<pixels.length;i+=3){
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    luma+=0.2126*r+0.7152*g+0.0722*b;
    sat+=(Math.max(r,g,b)-Math.min(r,g,b))/255;
    n++;
  }
  if(!n)return 0;
  return Math.min(1,Math.max(0,(luma/n/255)*(0.5+sat/n/2)));
}
