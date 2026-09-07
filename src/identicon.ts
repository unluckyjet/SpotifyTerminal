function djb2(id:string){
  let h=5381;
  for(let i=0;i<id.length;i++)h=((h<<5)+h+id.charCodeAt(i))>>>0;
  return h;
}

export function trackIdenticon(id:string,size=5):string{
  let n=Number.isFinite(size)?Math.trunc(size):5;
  n=Math.min(15,Math.max(5,n))|1;
  const half=(n+1)>>1;
  let seed=djb2(id),h=seed,remain=32,round=0;
  const bit=()=>{
    if(!remain){
      seed=djb2(`${id}:${++round}`);
      h=seed;remain=32;
    }
    const on=h&1;
    h>>>=1;remain--;
    return on?'█':' ';
  };
  const rows:string[]=[];
  for(let y=0;y<n;y++){
    const left:string[]=[];
    for(let x=0;x<half;x++)left.push(bit());
    rows.push(left.concat(left.slice(0,-1).reverse()).join(''));
  }
  return rows.join('\n');
}
