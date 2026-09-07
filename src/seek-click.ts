export function seekFromClick(x:number,bar:{x:number;width:number},duration:number):number|undefined{
  if(bar.width<=0||duration<0||x<bar.x||x>=bar.x+bar.width)return undefined;
  return Math.min(duration,Math.max(0,duration*(x-bar.x)/bar.width));
}
