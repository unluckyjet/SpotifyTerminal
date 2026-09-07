export type CheatRow={key:string;action:string};

export function defaultCheatRows():CheatRow[]{
  return [
    {key:'Space',action:'play/pause'},
    {key:'Left/Right',action:'skip'},
    {key:'Up/Down',action:'seek'},
    {key:'/',action:'commands'},
    {key:'M',action:'mini player'},
    {key:'F',action:'focus'},
    {key:'L/I',action:'lyrics/import'},
    {key:'P',action:'postcard'},
    {key:'H',action:'history'},
    {key:'Tab',action:'fullscreen'},
    {key:'S',action:'shuffle'},
    {key:'+/-',action:'volume'},
    {key:'O',action:'enable overlay'},
    {key:'Q',action:'quit'},
  ];
}

export function cheatSheetLines(extra?:CheatRow[]):string[]{
  const rows=[...defaultCheatRows(),...extra??[]];
  const width=Math.max(0,...rows.map(r=>r.key.length));
  return rows.map(r=>`${r.key.padEnd(width)}  ${r.action}`);
}
