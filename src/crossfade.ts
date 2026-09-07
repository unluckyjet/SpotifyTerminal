export function crossfadeMs(value:number):number{
  return Math.min(2000,Math.max(50,Number.isFinite(value)?value:400));
}
export function crossfadeProgress(startedAt:number,now:number,ms?:number):number{
  const t=(now-startedAt)/crossfadeMs(ms??400);
  return Number.isFinite(t)?Math.min(1,Math.max(0,t)):0;
}
