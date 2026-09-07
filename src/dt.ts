export function clampedDt(prev:number,now:number,cap=5):number{
  const limit=Number.isFinite(cap)?Math.max(0,cap):5;
  const dt=(now-prev)/1000;
  return Number.isFinite(dt)?Math.min(limit,Math.max(0,dt)):0;
}
