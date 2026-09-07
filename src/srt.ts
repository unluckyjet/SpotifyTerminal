export function srtStamp(seconds:number):string{
  const ms=Math.round((Number.isFinite(seconds)?Math.max(0,seconds):0)*1000);
  const h=Math.floor(ms/3_600_000),m=Math.floor(ms%3_600_000/60_000),s=Math.floor(ms%60_000/1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
}

export function lyricsToSrt(lines:{time:number;text:string}[],duration?:number):string{
  return lines.map((line,i)=>{
    const end=i+1<lines.length?lines[i+1].time:duration??line.time+3;
    return `${i+1}\n${srtStamp(line.time)} --> ${srtStamp(end)}\n${line.text}`;
  }).join('\n\n');
}
