export function jumpPosition(duration:number,percent:number):number{
  const d=Number.isFinite(duration)?Math.max(0,duration):0;
  const p=Number.isFinite(percent)?Math.min(100,Math.max(0,percent)):0;
  return d*p/100;
}
export function jumpKey(key:string,duration:number):number|undefined{
  if(key.length!==1||key<'0'||key>'9')return undefined;
  return jumpPosition(duration,+key*10);
}
