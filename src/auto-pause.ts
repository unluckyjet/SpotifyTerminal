export function shouldAutoPause(lastInteraction:number,playing:boolean,now=Date.now(),afterMs=30*60_000){
  return playing&&now-lastInteraction>=afterMs;
}
