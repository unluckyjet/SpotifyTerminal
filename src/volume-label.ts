export function volumeLabel(volume:number):string{
  const n=Math.min(100,Math.max(0,Math.round(Number.isFinite(volume)?volume:0)));
  return `${n}%`;
}
