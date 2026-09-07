import {test,expect} from 'bun:test';
import sharp from 'sharp';
import {postcardPNG} from './postcard';
import {Demo} from './spotify';
test('postcard renders original cover and safely escapes captions and metadata',async()=>{
  const track={...(await new Demo().read()),name:'Song <&> "name"',artist:'A & B'};
  const artwork={encoded:await sharp({create:{width:300,height:200,channels:3,background:'#f04c22'}}).png().toBuffer(),palette:Buffer.from([240,76,34])};
  const png=await postcardPNG(track,artwork,'<script>Caption & friends</script>');
  const info=await sharp(png).metadata();expect(info.width).toBe(1200);expect(info.height).toBe(1600);
  const center=await sharp(png).extract({left:600,top:600,width:1,height:1}).removeAlpha().raw().toBuffer();
  expect([...center]).toEqual([240,76,34]);
});
