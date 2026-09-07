function numericParts(version:string):number[]{
  const core=version.trim().replace(/^[vV]/,'').split(/[-+]/,1)[0]??'';
  return core.split('.').map(seg=>{
    const n=parseInt(seg,10);
    return Number.isFinite(n)&&n>=0?n:0;
  });
}

export function compareSemver(a:string,b:string):number{
  const left=numericParts(a);
  const right=numericParts(b);
  const n=Math.max(left.length,right.length);
  for(let i=0;i<n;i++){
    const da=left[i]??0;
    const db=right[i]??0;
    if(da!==db)return da<db?-1:1;
  }
  return 0;
}
