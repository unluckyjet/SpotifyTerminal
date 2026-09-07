export function isNight(hour:number,start=22,end=7){
  return start>end?hour>=start||hour<end:hour>=start&&hour<end;
}

export function dimTheme<T extends {bg:string;text:string;accent:string;muted:string}>(theme:T,amount=0.35):T{
  const t=Math.max(0,Math.min(1,amount));
  return Object.fromEntries(Object.keys(theme).map(key=>{
    const value=theme[key as keyof T] as string;
    const rgb=[1,3,5].map(i=>Math.round(parseInt(value.slice(i,i+2),16)*(1-t)));
    return [key,'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')];
  })) as T;
}
