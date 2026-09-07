export function relativeTime(iso:string,now=Date.now()):string{
  const t=Date.parse(iso);
  if(!Number.isFinite(t))return '';
  const s=(now-t)/1000;
  if(s<60)return 'just now';
  if(s<3600)return `${Math.floor(s/60)}m ago`;
  if(s<86400)return `${Math.floor(s/3600)}h ago`;
  if(s<604800)return `${Math.floor(s/86400)}d ago`;
  return new Date(t).toISOString().slice(0,10);
}
