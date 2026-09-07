import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {albumTheme} from './theme';
import {dataDirectory} from './history';
import type {Track} from './spotify';
import type {Artwork} from './cover';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
function lines(text:string,length:number,max:number){
  const words=text.replace(/\s+/g,' ').trim().split(' '),out:string[]=[];
  for(const word of words){if(!out.length||Array.from(out.at(-1)!+' '+word).length>length)out.push(word);else out[out.length-1]+=' '+word;}
  const result=out.slice(0,max).map(s=>Array.from(s).slice(0,length).join(''));
  if(out.length>max)result[max-1]=result[max-1].slice(0,-1)+'…';
  return result;
}
export async function postcardPNG(track:Track,artwork:Artwork,caption=''){
  const theme=albumTheme(artwork.palette);
  const cover=await sharp(artwork.encoded).rotate().resize(1040,1040,{fit:'contain',background:theme.bg}).png().toBuffer();
  const text=(value:string,x:number,y:number,size:number,color:string,weight=400)=>`<text x="${x}" y="${y}" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`;
  const title=lines(track.name,42,2),artist=lines(track.artist,64,1),album=lines(track.album,68,1),note=lines(caption.slice(0,160),72,2);
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="${theme.bg}"/>${text('LISTENING TO',80,80,20,theme.accent,500)}${title.map((s,i)=>text(s,80,1245+i*50,44,theme.text,600)).join('')}${artist.map(s=>text(s,80,1360,28,theme.accent)).join('')}${album.map(s=>text(s,80,1400,22,theme.muted)).join('')}${note.map((s,i)=>text(s,80,1460+i*32,24,theme.text)).join('')}${text('SPOTTERMINAL',80,1550,16,theme.muted)}</svg>`);
  return sharp(svg).composite([{input:cover,left:80,top:120}]).png().toBuffer();
}
export async function exportPostcard(track:Track,artwork:Artwork,caption='',directory=join(dataDirectory,'postcards')){
  const png=await postcardPNG(track,artwork,caption);
  await mkdir(directory,{recursive:true});
  const name=`${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID().slice(0,6)}.png`,path=join(directory,name);
  await writeFile(path,png,{flag:'wx'});return path;
}
