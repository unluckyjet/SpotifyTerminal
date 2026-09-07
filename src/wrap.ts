export function wrapText(text:string,width:number):string[]{
  const w=Math.floor(width);
  if(!Number.isFinite(w)||w<1)return [];
  const lines:string[]=[];
  for(const word of text.replace(/\s+/g,' ').trim().split(' ').filter(Boolean)){
    const chunks=word.length<=w?[word]:Array.from({length:Math.ceil(word.length/w)},(_,i)=>word.slice(i*w,(i+1)*w));
    for(const chunk of chunks){
      if(!lines.length||(lines.at(-1)+' '+chunk).length>w)lines.push(chunk);
      else lines[lines.length-1]+=' '+chunk;
    }
  }
  return lines;
}
