export function unpausePosition(position:number,pausedForMs:number,rewind=3):number{
  if(pausedForMs>=2000)return Math.max(0,position-rewind);
  return position;
}
