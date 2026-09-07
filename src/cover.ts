import {ImageRenderable, RGBA, type NativeImage, type OptimizedBuffer} from '@opentui/core';
import {renderChafa,type ChafaArtwork} from './chafa';

export type Artwork = {
  /** Original encoded cover from Spotify, without resizing or cropping. */
  encoded: Buffer;
  /** Small RGB sample used only for the surrounding color theme. */
  palette: Buffer;
};

export class CoverRenderable extends ImageRenderable {
  private sampled: NativeImage | null = null;
  private sampledSource: NativeImage | null = null;
  private sampleKey = '';
  private chafaSource: unknown;
  private chafaKey='';
  private chafaResult:ChafaArtwork|null=null;
  chafaReady:Promise<void>|null=null;
  private chafaGeneration=0;

  protected override renderSelf(buffer: OptimizedBuffer) {
    const source=this.image;
    if(this.effectiveProtocol!=='blocks'){
      this.clearSample();
      super.renderSelf(buffer);
      return;
    }
    if(!source){this.clearSample();return;}
    const fitted=this.getFittedSize(this.width,this.height);
    if(fitted.width<=0||fitted.height<=0)return;
    const key=`${fitted.width}x${fitted.height}`;
    if(Buffer.isBuffer(this.source)){
      const chafaKey=`${key}:${this.cellAspectRatio}`;
      if(this.chafaSource!==this.source||this.chafaKey!==chafaKey){
        this.chafaSource=this.source;this.chafaKey=chafaKey;this.chafaResult=null;
        const generation=++this.chafaGeneration;
        this.chafaReady=renderChafa(this.source,fitted.width,fitted.height,1/this.cellAspectRatio).then(result=>{
          if(generation===this.chafaGeneration&&!this.isDestroyed){this.chafaResult=result;this.requestRender();}
        }).catch(()=>{ /* Keep the smoothed native fallback if Chafa cannot decode a cover. */ });
      }
      if(this.chafaResult){
        const result=this.chafaResult;
        const x=this.x+Math.floor((this.width-result.width)/2),y=this.y+Math.floor((this.height-result.height)/2);
        for(const cell of result.cells)buffer.drawText(cell.char,x+cell.x,y+cell.y,RGBA.fromHex(cell.fg),RGBA.fromHex(cell.bg));
        return;
      }
    }
    if(this.sampledSource!==source||this.sampleKey!==key){
      this.clearSample();
      // Average the original image into the four subpixels each character can
      // represent, avoiding jagged point sampling. Reuse it until track/size changes.
      this.sampled=source.resize({width:fitted.width*2,height:fitted.height*2,kernel:'area'});
      this.sampledSource=source;
      this.sampleKey=key;
    }
    const sample=this.sampled!;
    const x=this.x+Math.floor((this.width-fitted.width)/2);
    const y=this.y+Math.floor((this.height-fitted.height)/2);
    buffer.drawImage(sample,x,y,fitted.width,fitted.height,0,0,0,0,sample.width,sample.height,'blocks');
  }

  private clearSample(){
    this.sampled?.dispose();
    this.sampled=null;this.sampledSource=null;this.sampleKey='';
  }

  protected override destroySelf(){
    this.chafaGeneration++;this.chafaResult=null;
    this.clearSample();
    super.destroySelf();
  }
}
