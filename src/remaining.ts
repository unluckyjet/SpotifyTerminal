export function timeRemaining(position:number,duration:number):number{
  return Math.max(0,duration-Math.max(0,position));
}
export function formatRemaining(position:number,duration:number):string{
  const s=Math.max(0,timeRemaining(position,duration));
  return `-${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
}
