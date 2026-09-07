const dayMs=86_400_000;
function utcDay(value:string){
  const t=Date.parse(value);
  if(!Number.isFinite(t))return;
  return Math.floor(t/dayMs);
}
function runEnding(days:Set<number>,from:number){
  let n=0;for(let d=from;days.has(d);d--)n++;return n;
}
export function listeningStreak(playedAt:string[],today?:string):{current:number;longest:number}{
  const days=new Set<number>();
  for(const at of playedAt){const n=utcDay(at);if(n!==undefined)days.add(n);}
  if(!days.size)return {current:0,longest:0};
  const sorted=[...days].sort((a,b)=>a-b);
  let longest=1,run=1;
  for(let i=1;i<sorted.length;i++){
    if(sorted[i]===sorted[i-1]+1)run++;
    else {longest=Math.max(longest,run);run=1;}
  }
  longest=Math.max(longest,run);
  const todayNum=utcDay(today??new Date().toISOString())??Math.floor(Date.now()/dayMs);
  const current=days.has(todayNum)?runEnding(days,todayNum):days.has(todayNum-1)?runEnding(days,todayNum-1):0;
  return {current,longest};
}
