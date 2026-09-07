export function parseIntStrict(text:string,min?:number,max?:number):number|undefined{
  const raw=text.trim();
  if(!/^-?\d+$/.test(raw))return;
  const n=Number(raw);
  if(!Number.isSafeInteger(n))return;
  if(min!==undefined&&n<min)return;
  if(max!==undefined&&n>max)return;
  return n===0?0:n;
}
