import { TextRenderable, StyledText, RGBA, type CliRenderer } from '@opentui/core';
import type {Track, Command} from './spotify';
import {albumTheme,blendTheme} from './theme';
import {CoverRenderable, type Artwork} from './cover';
import type {ArtworkOverlay,OverlayLayout} from './overlay';
export const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
type Cell={c:string;f:string;b:string};
export type Dialog={title:string;input?:string;lines?:string[];footer:string;selected?:number};
export class PlayerUI {
  private themePixels?:Buffer;
  private theme=albumTheme();
  rows: TextRenderable[]=[]; hits: {x:number;y:number;w:number;command:Command}[]=[];
  readonly cover: CoverRenderable;
  readonly previousCover:CoverRenderable;
  transitions=false;
  private lastArtwork?:Artwork;
  private transitionStart=0;
  private fromTheme=albumTheme();
  fullscreen=false;
  gallery?:{index:number;total:number};
  dialog?:Dialog;
  lastInteraction=Date.now();
  interact(){this.lastInteraction=Date.now();}
  toggleFullscreen(){this.fullscreen=!this.fullscreen;this.interact();}
  constructor(public renderer:CliRenderer, public action:(c:Command)=>void, private overlay?:ArtworkOverlay) {
    this.previousCover=new CoverRenderable(renderer,{id:'previous-cover',position:'absolute',fit:'fit',protocol:'auto',zIndex:1,visible:false});renderer.root.add(this.previousCover);
    this.cover=new CoverRenderable(renderer,{id:'album-cover',position:'absolute',fit:'fit',protocol:'auto',zIndex:2,visible:false,buffered:true});
    renderer.root.add(this.cover);
  }
  draw(track:Track, artwork:Artwork|undefined, demo:boolean, status:string) {
    const W=this.renderer.width,H=this.renderer.height;
    const fullscreen=this.fullscreen&&!this.gallery;
    artwork=artwork??(this.transitions?this.lastArtwork:undefined);
    const pixels=artwork?.palette;
    if(this.cover.source!==artwork?.encoded){
      if(this.transitions&&this.lastArtwork&&artwork){this.previousCover.source=this.lastArtwork.encoded;this.transitionStart=Date.now();this.fromTheme=this.theme;}
      this.cover.source=artwork?.encoded;
    }
    if(artwork)this.lastArtwork=artwork;
    this.cover.visible=false;
    if(pixels!==this.themePixels){this.themePixels=pixels;this.theme=albumTheme(pixels);}
    const transitionProgress=this.transitions?Math.min(1,(Date.now()-this.transitionStart)/400):1;
    const colors=blendTheme(this.fromTheme,this.theme,transitionProgress);
    this.previousCover.visible=false;
    this.cover.opacity=transitionProgress;
    if(transitionProgress===1)this.previousCover.source=undefined;
    const grid:Cell[][]=Array.from({length:H},()=>Array.from({length:W},()=>({c:' ',f:colors.text,b:colors.bg})));
    const put=(x:number,y:number,s:string,f=colors.text,b=colors.bg)=>{for(const c of s){if(grid[y]?.[x])grid[y][x]={c,f,b};x++;}};
    this.hits=[];
    let layout:OverlayLayout|undefined;
    if(W<32||H<16){
      put(1,1,'Resize terminal to 32 × 16.',colors.muted);
    } else {
      // Use the available terminal area for detail, respecting measured cell
      // proportions when supported (otherwise OpenTUI assumes 2:1 cells).
      const aspect=this.cover.cellAspectRatio;
      const showControls=!this.gallery&&(!fullscreen||Date.now()-this.lastInteraction<2200);
      const artH=Math.max(1,Math.min(H-(fullscreen?7:12),Math.floor((W-8)/aspect)));
      const artW=Math.min(W-8,Math.round(artH*aspect));
      const width=Math.min(W-8,Math.max(64,artW+12)),left=Math.floor((W-width)/2);
      const top=Math.max(1,Math.floor((H-artH-(fullscreen?6:10))/2));
      const centered=(text:string,y:number,color=colors.text)=>{
        const clean=Array.from(text.replace(/[\r\n\x1b]/g,' '));
        const label=clean.length>width?clean.slice(0,width-1).join('')+'…':clean.join('');
        put(left+Math.floor((width-Array.from(label).length)/2),y,label,color);
      };
      if(!fullscreen){centered(track.name,top);centered(track.album,top+1,colors.muted);centered(track.artist,top+2,colors.accent);}
      const ax=Math.floor((W-artW)/2),ay=top+(fullscreen?0:4);
      this.cover.left=ax;
      this.cover.top=ay;
      this.cover.width=artW;
      this.cover.height=artH;
      this.cover.visible=!!artwork;
      this.previousCover.left=ax;this.previousCover.top=ay;this.previousCover.width=artW;this.previousCover.height=artH;
      this.previousCover.visible=!!artwork&&transitionProgress<1;
      if(this.cover.loadError){
        centered('Album cover unavailable',ay+Math.floor(artH/2),colors.muted);
      }
      const barY=ay+artH+1,controlY=barY+2;
      layout={cover:{x:ax,y:ay,width:artW,height:artH},anchor:{text:'─'.repeat(width),x:left,y:barY},background:colors.bg};
      const progress=Math.round(Math.min(1,Math.max(0,track.position/Math.max(track.duration,1)))*width);
      put(left,barY,'─'.repeat(progress),colors.accent);
      put(left+progress,barY,'─'.repeat(width-progress),colors.muted);
      if(showControls)put(left,controlY,clock(track.position),colors.muted);
      const duration=clock(track.duration);
      if(showControls)put(left+width-duration.length,controlY,duration,colors.muted);
      const button=(x:number,label:string,c:Command)=>{
        put(x,controlY,label);
        this.hits.push({x,y:controlY,w:label.length,command:c});
      };
      const center=Math.floor(W/2);
      const spacing=width<40?5:8;
      if(showControls){button(center-spacing-1,' ← ','previous');button(center-1,track.playing?' Ⅱ ':' ▶ ','toggle');button(center+spacing-1,' → ','next');}
      const note=this.gallery?`History ${this.gallery.index+1}/${this.gallery.total} · ← → browse · H back`:(status||this.overlay?.note|| (demo?'demo · no audio':''));
      if(note)put(left,Math.min(H-1,controlY+2),note.replace(/[\r\n\x1b]/g,' ').slice(0,width),colors.muted);
    }
    if(this.dialog){
      this.cover.visible=false;this.previousCover.visible=false;layout=undefined;this.hits=[];
      for(const row of grid)for(const cell of row){cell.c=' ';cell.f=colors.text;cell.b=colors.bg;}
      const width=Math.min(70,W-4),left=Math.max(1,Math.floor((W-width)/2)),top=Math.max(1,Math.floor((H-12)/2));
      put(left,top,this.dialog.title.slice(0,width),colors.accent);
      if(this.dialog.input!==undefined)put(left,top+2,('› '+this.dialog.input+'▏').slice(-width));
      const entries=this.dialog.lines??[];
      entries.slice(0,Math.max(0,H-top-7)).forEach((line,i)=>put(left,top+4+i,((i===this.dialog!.selected?'› ':'  ')+line).slice(0,width),i===this.dialog!.selected?colors.accent:colors.text));
      put(left,Math.min(H-2,top+Math.max(8,entries.length+5)),this.dialog.footer.slice(0,width),colors.muted);
    }
    // Keep the fallback under the native panel until it acknowledges this exact
    // source and layout; it also stays available while the app is in background.
    while(this.rows.length>H)this.rows.pop()!.destroy();
    for(let y=0;y<H;y++){
      if(!this.rows[y]){const row=new TextRenderable(this.renderer,{id:`row-${y}`,position:'absolute',left:0,top:y,width:W,height:1,onMouseMove:()=>this.interact(),onMouseDown:e=>{this.interact();const h=this.hits.find(h=>e.y===h.y&&e.x>=h.x&&e.x<h.x+h.w);if(h)this.action(h.command);}});this.rows.push(row);this.renderer.root.add(row);}
      const chunks:any[]=[];
      for(const p of grid[y]) {const prev=chunks.at(-1);if(prev&&prev.fc===p.f&&prev.bc===p.b)prev.text+=p.c;else chunks.push({__isChunk:true,text:p.c,fg:RGBA.fromHex(p.f),bg:RGBA.fromHex(p.b),fc:p.f,bc:p.b});}
      this.rows[y].width=W;this.rows[y].content=new StyledText(chunks);
    }
    this.overlay?.setTransitions(this.transitions);
    this.overlay?.update(artwork,layout,this.cover.effectiveProtocol==='blocks');
  }
}
