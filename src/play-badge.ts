export function playBadge(count:number):string{
  const n=Math.floor(Number.isFinite(count)?count:0);
  return n>0?`×${n}`:'';
}
