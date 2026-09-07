export function searchHistory<T extends {name:string;artist:string;album:string}>(entries:T[],query:string):T[]{
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length)return entries;
  return entries.filter(e=>words.every(w=>`${e.name} ${e.artist} ${e.album}`.toLowerCase().includes(w)));
}
