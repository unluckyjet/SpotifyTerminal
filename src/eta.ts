export function etaClock(position:number,duration:number,now=new Date()){
  const remaining=Math.max(0,duration-Math.max(0,position));
  const eta=new Date(now.getTime()+remaining*1000);
  return `${String(eta.getHours()).padStart(2,'0')}:${String(eta.getMinutes()).padStart(2,'0')}`;
}
