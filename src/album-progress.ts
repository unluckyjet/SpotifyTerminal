export function albumProgress(entries:{album:string;id:string}[]):{album:string;tracks:number}[]{
  const seen=new Map<string,Set<string>>();
  for(const {album,id} of entries){
    let ids=seen.get(album);
    if(!ids)seen.set(album,ids=new Set());
    ids.add(id);
  }
  return [...seen].map(([album,ids])=>({album,tracks:ids.size}));
}
