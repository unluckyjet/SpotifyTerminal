export function duplicateKey(track:{name:string;artist:string}):string{
  return `${track.name.trim().toLowerCase()}|${track.artist.trim().toLowerCase()}`;
}

export function findDuplicates<T extends {id:string;name:string;artist:string}>(entries:T[]):T[][]{
  const groups=new Map<string,T[]>();
  for(const entry of entries){
    const key=duplicateKey(entry);
    const items=groups.get(key);
    if(items)items.push(entry);
    else groups.set(key,[entry]);
  }
  return [...groups.values()].filter(group=>group.length>1);
}
