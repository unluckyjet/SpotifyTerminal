export function parseVolume(value:string|undefined):number{
  const raw=value?.trim();
  const n=raw?Number(raw):NaN;
  if(!Number.isFinite(n))throw new Error(`Unknown volume: ${value}`);
  return Math.min(100,Math.max(0,Math.round(n)));
}
