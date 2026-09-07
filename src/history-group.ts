export function groupHistory<T extends {artist:string;album:string}>(entries:T[],by:'artist'|'album'):{key:string;items:T[]}[]{
  const groups=new Map<string,T[]>();
  for(const entry of entries){
    const key=entry[by]||'Unknown';
    const items=groups.get(key);
    if(items)items.push(entry);
    else groups.set(key,[entry]);
  }
  return [...groups].map(([key,items])=>({key,items}));
}
