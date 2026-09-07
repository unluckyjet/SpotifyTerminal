import {createCliRenderer} from '@opentui/core';
import sharp from 'sharp';
import {Spotify,Demo,type Command,type Track} from './spotify';
import {PlayerUI} from './ui';
import type {Artwork} from './cover';
import {ArtworkOverlay} from './overlay';
import {ListeningHistory} from './history';
import {exportPostcard} from './postcard';
import {CommandPalette} from './palette';
import {LyricsLibrary} from './lyrics';
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('spotterminal [--demo] [--no-autoplay] [--no-overlay] [--no-menubar] [--system-media] [--fullscreen] [--transitions]\nSpace: play/pause | Left/Right: skip | Up/Down: seek 10s\n/: commands | P: postcard | H: history | Tab: fullscreen | S: shuffle | +/-: volume | O: enable overlay | Q: quit (music continues)');process.exit(0);}
if(args.includes('--lyrics')&&(!args[args.indexOf('--lyrics')+1]||args[args.indexOf('--lyrics')+1].startsWith('--'))){console.error('--lyrics needs a path to an .lrc file');process.exit(1);}
const demo=args.includes('--demo');
if(!demo&&process.platform!=='darwin'){console.error('Live playback requires Spotify for macOS. Try spotterminal --demo.');process.exit(1);}
const lyricsLibrary=new LyricsLibrary();
let lyricsTrack='',lyricsVersion=0;
let pendingLyricsPath=args.includes('--lyrics')?args[args.indexOf('--lyrics')+1]:undefined;
const history=new ListeningHistory();await history.load();
const backend=demo?new Demo():new Spotify();
const renderer=await createCliRenderer({exitOnCtrlC:false,useMouse:true});
let track:Track={id:'',name:'Connecting to Spotify…',artist:'',album:'',artwork:'',duration:0,position:0,playing:false,volume:0,shuffle:false};
let status='',cover:Artwork|undefined,artUrl='',closed=false,busy=false;
async function artwork(url:string){
  if(url===artUrl)return;
  artUrl=url;cover=undefined;
  if(!url)return;
  try{
    const u=new URL(url);if(u.protocol!=='https:')return;
    const res=await fetch(u,{signal:AbortSignal.timeout(6000)});
    if(!res.ok)throw Error('Artwork unavailable');
    const encoded=Buffer.from(await res.arrayBuffer());
    const palette=await sharp(encoded).resize(32,32,{fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
    if(!closed && url===artUrl)cover={encoded,palette};
  }catch{
    // Permit the next poll to retry a transient artwork failure.
    if(url===artUrl)artUrl='';
  }
}
async function poll(){if(busy||closed)return;busy=true;try{track=await backend.read();status='';void artwork(track.artwork);if(track.id!==lyricsTrack){lyricsTrack=track.id;const id=track.id,version=++lyricsVersion;ui.lyricLines=[];void lyricsLibrary.load(id).then(lines=>{if(version===lyricsVersion)ui.lyricLines=lines;});}if(pendingLyricsPath&&track.id){const path=pendingLyricsPath;pendingLyricsPath=undefined;void importLyrics(path,track.id);}}catch(e){status=e instanceof Error?e.message:String(e);track.playing=false;}finally{busy=false;}}
let historyIndex=0,historyVersion=0,historyCover:Artwork|undefined;
let historyTrack:Track|undefined;
async function browseHistory(delta=0){
  const version=++historyVersion;
  if(!history.entries.length){status='Your listening history is empty';return;}
  historyIndex=(historyIndex+delta+history.entries.length)%history.entries.length;
  const entry=history.entries[historyIndex];
  historyTrack={...track,...entry,playing:false,position:0,duration:0};historyCover=undefined;
  ui.gallery={index:historyIndex,total:history.entries.length};
  const encoded=await history.cover(entry);
  if(encoded){try{const palette=await sharp(encoded).resize(32,32).removeAlpha().toColourspace('srgb').raw().toBuffer();if(version===historyVersion)historyCover={encoded,palette};}catch{status='Saved cover unavailable';}}
}
let lyricsImportMode=false,lyricsPathInput='',lyricsImportTrack='';
function openLyricsImport(){lyricsImportMode=true;lyricsPathInput='';lyricsImportTrack=track.id;ui.dialog={title:'Import lyrics for '+track.name,input:'',footer:'Path to .lrc file · Enter import · Escape cancel'};}
async function importLyrics(path:string,id:string){
  try{const lines=await lyricsLibrary.import(id,path);if(track.id===id){lyricsVersion++;ui.lyricLines=lines;ui.lyricsOpen=true;}status='Lyrics imported';}catch(e){status=String(e);}
}
let captionMode=false,caption='';
let postcardSelection:{track:Track;artwork:Artwork}|undefined;
function openPostcard(){
  if(!cover){status='Album artwork is still loading';return;}
  postcardSelection={track:{...track},artwork:cover};captionMode=true;caption='';ui.dialog={title:'Create a listening postcard',input:'',footer:'Enter save · Escape cancel · caption optional'};
}
async function savePostcard(){
  captionMode=false;ui.dialog=undefined;
  if(!postcardSelection)return;
  const {track:snapshot,artwork:image}=postcardSelection;postcardSelection=undefined;status='Saving postcard…';
  try{const path=await exportPostcard(snapshot,image,caption);status=`Saved to postcards/${path.split('/').at(-1)}`;}catch(e){status=`Could not save postcard: ${String(e)}`;}
}
let queue=Promise.resolve();
const action=(c:Command)=>{queue=queue.then(async()=>{if(closed)return;try{await backend.command(c);await poll();}catch(e){status=e instanceof Error?e.message:String(e);}});};
const overlay=new ArtworkOverlay(true,event=>{if(event.command==='quit')quit();else if(event.command==='seek'){queue=queue.then(async()=>{try{await backend.seek(event.position);await poll();}catch(e){status=String(e);}});}else action(event.command);},{overlay:!args.includes('--no-overlay'),menuBar:!args.includes('--no-menubar'),systemMedia:args.includes('--system-media')&&!demo});
renderer.setTerminalTitle(overlay.token);
const ui=new PlayerUI(renderer,action,overlay);
ui.fullscreen=args.includes('--fullscreen');ui.transitions=args.includes('--transitions');
const animation=setInterval(()=>{if(!closed){overlay.setTrack(track,cover);if(!demo)void history.record(track,cover).catch(()=>{status='Could not save listening history';});ui.draw(ui.gallery&&historyTrack?historyTrack:track,ui.gallery?historyCover:cover,demo,status);}},100);
const polling=setInterval(()=>void poll(),1000);
function quit(){closed=true;overlay.close();clearInterval(animation);clearInterval(polling);renderer.destroy();process.exit(0);}
let paletteOpen=false;
const palette=new CommandPalette([
  {id:'toggle',label:'Play / pause',run:()=>action('toggle')},
  {id:'next',label:'Next track',keywords:'skip',run:()=>action('next')},
  {id:'previous',label:'Previous track',keywords:'back',run:()=>action('previous')},
  {id:'louder',label:'Volume up',run:()=>action('louder')},
  {id:'quieter',label:'Volume down',run:()=>action('quieter')},
  {id:'shuffle',label:'Toggle shuffle',run:()=>action('shuffle')},
  {id:'fullscreen',label:'Toggle fullscreen artwork',run:()=>ui.toggleFullscreen()},
  {id:'history',label:'Browse listening history',run:()=>browseHistory()},
  {id:'postcard',label:'Create a listening postcard',keywords:'export image caption',run:openPostcard},
  {id:'transitions',label:'Toggle cover transitions',keywords:'animation fade',run:()=>{ui.transitions=!ui.transitions;}},
  {id:'overlay',label:'Enable native artwork overlay',keywords:'accessibility',run:()=>overlay.requestAccess()},
  {id:'lyrics',label:'Toggle synchronized lyrics',run:()=>{ui.lyricsOpen=!ui.lyricsOpen;}},
  {id:'import-lyrics',label:'Import lyrics from an LRC file',run:openLyricsImport},
  {id:'quit',label:'Quit Spotterminal',run:quit},
]);
function refreshPalette(){const view=palette.view(Math.max(1,Math.min(8,renderer.height-12)));ui.dialog={title:'Commands',input:palette.query,...view,footer:view.lines.length?'↑ ↓ choose · Enter run · Escape close':'No matching commands · Escape close'};}
renderer.keyInput.on('keypress',key=>{
  ui.interact();
  if(key.ctrl&&key.name==='c')return quit();
  const printable=!key.ctrl&&!key.meta&&key.sequence&&!/[\x00-\x1f\x7f]/.test(key.sequence);
  if(lyricsImportMode){
    if(key.name==='escape'){lyricsImportMode=false;ui.dialog=undefined;}
    else if(key.name==='return'){lyricsImportMode=false;ui.dialog=undefined;void importLyrics(lyricsPathInput,lyricsImportTrack);}
    else if(key.name==='backspace')lyricsPathInput=Array.from(lyricsPathInput).slice(0,-1).join('');
    else if(printable)lyricsPathInput=(lyricsPathInput+key.sequence).slice(0,1000);
    if(ui.dialog)ui.dialog.input=lyricsPathInput;return;
  }
  if(captionMode){
    if(key.name==='escape'){captionMode=false;ui.dialog=undefined;}
    else if(key.name==='return')void savePostcard();
    else if(key.name==='backspace')caption=Array.from(caption).slice(0,-1).join('');
    else if(printable)caption=(caption+key.sequence).slice(0,160);
    if(ui.dialog)ui.dialog.input=caption;
    return;
  }
  if(paletteOpen){
    if(key.name==='escape'){paletteOpen=false;ui.dialog=undefined;return;}
    if(key.name==='return'){const selected=palette.choose();paletteOpen=false;ui.dialog=undefined;void selected?.run();return;}
    if(key.name==='up')palette.move(-1);
    else if(key.name==='down')palette.move(1);
    else if(key.name==='backspace')palette.edit(Array.from(palette.query).slice(0,-1).join(''));
    else if(printable)palette.edit((palette.query+key.sequence).slice(0,100));
    refreshPalette();return;
  }
  if(key.name==='/'||key.sequence==='/'){paletteOpen=true;palette.edit('');refreshPalette();return;}
  if(key.name==='l'){ui.lyricsOpen=!ui.lyricsOpen;return;}
  if(key.name==='i'){openLyricsImport();return;}
  if(key.name==='p'){openPostcard();return;}
  if(key.name==='t'){ui.transitions=!ui.transitions;status=`Transitions ${ui.transitions?'on':'off'}`;return;}
  if(key.name==='h'){if(ui.gallery){ui.gallery=undefined;historyVersion++;}else void browseHistory();return;}
  if(ui.gallery&&(key.name==='left'||key.name==='right')){void browseHistory(key.name==='right'?1:-1);return;}
  if(ui.gallery&&key.name==='escape'){ui.gallery=undefined;historyVersion++;return;}
  if(key.name==='tab'){ui.toggleFullscreen();return;}
  if(key.name==='q')return quit();
  if(key.name==='o'){overlay.requestAccess();return;}
  const keys:Record<string,Command>={space:'toggle',right:'next',left:'previous',up:'forward',down:'back',s:'shuffle','+':'louder','=':'louder','-':'quieter'};
  const c=keys[key.name]??keys[key.sequence];if(c)action(c);
});
process.on('SIGTERM',quit);process.on('SIGINT',quit);
ui.draw(track,cover,demo,status);
if(!args.includes('--no-autoplay'))action('play');else void poll();
