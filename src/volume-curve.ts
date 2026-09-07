const clamp=(n:number)=>Math.min(100,Math.max(0,Number.isFinite(n)?n:0));
export function linearToLogVolume(linear:number):number{
  const x=clamp(linear);
  return x*x/100;
}
export function logToLinearVolume(log:number):number{
  return Math.sqrt(clamp(log)*100);
}
