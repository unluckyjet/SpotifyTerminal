const BARS=' ▂▃▄▅▆▇█';
export function hourHeatmap(playedAt:string[]):number[]{
  const hours=Array.from({length:24},()=>0);
  for(const stamp of playedAt){
    const t=Date.parse(stamp);
    if(Number.isNaN(t))continue;
    hours[new Date(t).getUTCHours()]++;
  }
  return hours;
}
export function formatHeatmap(hours:number[]):string{
  const counts=Array.from({length:24},(_,i)=>{
    const n=hours[i];
    return Number.isFinite(n)&&n>0?n:0;
  });
  const max=Math.max(0,...counts);
  if(max===0)return ' '.repeat(24);
  return counts.map(n=>BARS[Math.round(n/max*(BARS.length-1))]).join('');
}
