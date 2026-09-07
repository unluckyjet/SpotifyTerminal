export function shiftLyrics<T extends {time:number}>(lines:T[],seconds:number):T[]{
  return lines.map(line=>({...line,time:Math.max(0,line.time+seconds)}));
}
export function clampOffset(seconds:number){
  return Math.min(10,Math.max(-10,seconds));
}
export function nudgeLyrics<T extends {time:number}>(lines:T[],current:number,delta:number){
  const next=clampOffset(current+delta);
  const shift=next-current;
  if(shift===0)return {nudge:current,lines,changed:false as const};
  return {nudge:next,lines:shiftLyrics(lines,shift),changed:true as const};
}
