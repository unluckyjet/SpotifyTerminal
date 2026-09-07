export function sanitizeFilename(name:string,max=80):string{
  const n=Number.isFinite(max)?Math.max(0,Math.floor(max)):80;
  const s=name.replace(/[/\\:*?"<>|\u0000-\u001f\u007f-\u009f]/g,'-').replace(/\s+/g,' ').trim();
  return Array.from(s).slice(0,n).join('')||'untitled';
}
