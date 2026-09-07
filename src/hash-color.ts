export function hashColor(id:string):string{
  let h=5381;
  for(let i=0;i<id.length;i++)h=((h<<5)+h+id.charCodeAt(i))>>>0;
  return '#'+(h&0xffffff).toString(16).padStart(6,'0');
}
