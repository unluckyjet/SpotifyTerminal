export function isoWeek(iso:string):string{
  const t=Date.parse(iso);
  if(!Number.isFinite(t))return '';
  const d=new Date(t);
  const date=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  const week=Math.floor(Math.round((date.getTime()-Date.UTC(date.getUTCFullYear(),0,1))/86_400_000)/7)+1;
  return `${date.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
}

export function weekStats(playedAt:string[],week=isoWeek(new Date().toISOString())):{plays:number;days:number}{
  const days=new Set<string>();
  let plays=0;
  for(const stamp of playedAt){
    const t=Date.parse(stamp);
    if(!Number.isFinite(t))continue;
    if(isoWeek(stamp)!==week)continue;
    plays++;
    days.add(new Date(t).toISOString().slice(0,10));
  }
  return {plays,days:days.size};
}
