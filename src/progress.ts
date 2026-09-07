export function progressPercent(position:number,duration:number){
  if(duration<=0)return 0;
  return Math.round(100*Math.min(1,Math.max(0,position/duration)));
}
export function progressLabel(position:number,duration:number){
  return `${progressPercent(position,duration)}%`;
}
