export function isIdle(lastInteraction:number,now=Date.now(),afterMs=8000){
  return now-lastInteraction>=afterMs;
}
export function idleOpacity(lastInteraction:number,now=Date.now(),afterMs=8000){
  if(!isIdle(lastInteraction,now,afterMs))return 1;
  return Math.max(0.35,1-(now-lastInteraction-afterMs)/10_000);
}
