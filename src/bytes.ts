const KiB=1024;
const MiB=1024**2;
const GiB=1024**3;
const TiB=1024**4;

export function formatBytes(n:number):string{
  const bytes=Number.isFinite(n)&&n>0?n:0;
  if(bytes<KiB)return `${Math.round(bytes)} B`;
  if(bytes<MiB)return `${(bytes/KiB).toFixed(1)} KB`;
  if(bytes<GiB)return `${(bytes/MiB).toFixed(1)} MB`;
  if(bytes<TiB)return `${(bytes/GiB).toFixed(1)} GB`;
  return `${(bytes/TiB).toFixed(1)} TB`;
}
