export function seededShuffle<T>(items:T[],seed:number):T[]{
  const out=items.slice();
  let s=seed>>>0;
  for(let i=out.length-1;i>0;i--){
    s=(Math.imul(1664525,s)+1013904223)>>>0;
    const j=Math.floor(s/4294967296*(i+1));
    const t=out[i];out[i]=out[j];out[j]=t;
  }
  return out;
}
