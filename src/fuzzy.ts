export function levenshtein(a:string,b:string):number{
  if(a===b)return 0;
  const s=[...a],t=[...b];
  if(!s.length)return t.length;
  if(!t.length)return s.length;
  const row=Array.from({length:t.length+1},(_,j)=>j);
  for(let i=1;i<=s.length;i++){
    let prev=row[0];
    row[0]=i;
    for(let j=1;j<=t.length;j++){
      const cur=row[j];
      row[j]=s[i-1]===t[j-1]?prev:1+Math.min(prev,row[j],row[j-1]);
      prev=cur;
    }
  }
  return row[t.length];
}

function nameArtistDistance(query:string,name:string,artist:string):number{
  const n=name.trim().toLowerCase();
  const a=artist.trim().toLowerCase();
  const combined=`${n} ${a}`.trim();
  let best=Math.min(levenshtein(query,n),levenshtein(query,a),levenshtein(query,combined));
  for(const word of combined.split(/\s+/))best=Math.min(best,levenshtein(query,word));
  return best;
}

export function fuzzyMatch<T extends {name:string;artist:string}>(entries:T[],query:string,max=2):T[]{
  const q=query.trim().toLowerCase();
  const limit=Number.isFinite(max)?Math.max(0,max):2;
  if(!q)return entries.slice();
  return entries.map(e=>({e,d:nameArtistDistance(q,e.name,e.artist)})).filter(x=>x.d<=limit).sort((a,b)=>a.d-b.d).map(x=>x.e);
}
