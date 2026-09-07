export function fadeSteps(from:number,to:number,ms:number,interval=100):{volume:number;wait:number}[]{
  const volume=(n:number)=>Math.min(100,Math.max(0,Math.round(Number.isFinite(n)?n:0)));
  const start=volume(from);
  const end=volume(to);
  if(!Number.isFinite(ms)||ms<=0)return [{volume:end,wait:0}];
  const wait=Number.isFinite(interval)&&interval>0?interval:100;
  const n=Math.max(1,Math.ceil(ms/wait));
  const steps:{volume:number;wait:number}[]=[];
  for(let i=0;i<=n;i++)steps.push({volume:volume(start+(end-start)*i/n),wait:i===n?0:wait});
  steps[n]!.volume=end;
  return steps;
}
