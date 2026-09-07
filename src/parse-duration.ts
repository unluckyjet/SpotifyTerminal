export function parseDuration(text:string):number|undefined{
  const raw=text.trim();
  if(/^\d+$/.test(raw)){
    const n=Number(raw);
    return Number.isFinite(n)?n:undefined;
  }
  const hms=/^(\d+):([0-5]\d):([0-5]\d)$/.exec(raw);
  if(hms){
    const n=Number(hms[1])*3600+Number(hms[2])*60+Number(hms[3]);
    return Number.isFinite(n)?n:undefined;
  }
  const ms=/^(\d+):([0-5]\d)$/.exec(raw);
  if(ms){
    const n=Number(ms[1])*60+Number(ms[2]);
    return Number.isFinite(n)?n:undefined;
  }
}
