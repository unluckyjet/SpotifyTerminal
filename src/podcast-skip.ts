export function skipBy(position:number,duration:number,delta:number):number{
  const end=Number.isFinite(duration)?Math.max(0,duration):0;
  const from=Number.isFinite(position)?position:0;
  const step=Number.isFinite(delta)?delta:0;
  return Math.min(end,Math.max(0,from+step));
}
