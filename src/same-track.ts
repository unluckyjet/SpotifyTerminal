export function sameTrack(a:{id:string;name:string;artist:string},b:{id:string;name:string;artist:string}):boolean{
  if(a.id&&b.id)return a.id===b.id;
  return a.name.toLowerCase()===b.name.toLowerCase()&&a.artist.toLowerCase()===b.artist.toLowerCase();
}
