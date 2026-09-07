import {expect, test} from 'bun:test';
import sharp from 'sharp';
import {renderChafa} from './chafa';

const nearColor = (actual: string, expected: string) => [1, 3, 5].every(i =>
  Math.abs(parseInt(actual.slice(i, i + 2), 16) - parseInt(expected.slice(i, i + 2), 16)) <= 2);

test('Chafa preserves full-color artwork and respects terminal cell proportions', async () => {
  const encoded = await sharp({create: {width: 80, height: 80, channels: 3, background: '#d93a71'}}).png().toBuffer();
  // Deliberately use an offset Buffer to catch accidental decoding of pooled bytes.
  const padded = Buffer.concat([Buffer.from('prefix'), encoded, Buffer.from('suffix')]);
  const result = await renderChafa(padded.subarray(6, 6 + encoded.length), 40, 30, 0.5);
  expect([result.width, result.height]).toEqual([40, 20]);
  expect(result.cells).toHaveLength(800);
  for (const cell of result.cells) {
    expect(cell.x).toBeLessThan(40);
    expect(cell.y).toBeLessThan(20);
    expect(cell.char).not.toMatch(/[\x00-\x1f\x7f]/);
    expect([cell.fg, cell.bg].some(c => nearColor(c, '#d93a71'))).toBe(true);
    expect(cell.fg).toMatch(/^#[0-9a-f]{6}$/);
    expect(cell.bg).toMatch(/^#[0-9a-f]{6}$/);
  }
  const squareCells = await renderChafa(encoded, 40, 30, 1);
  expect([squareCells.width, squareCells.height]).toEqual([30, 30]);
});

test('Chafa keeps both edges of a wide cover and matches diagonal detail', async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#143366"/><path d="M0 80 L160 0 L160 80Z" fill="#f3b49a"/><rect width="8" height="80" fill="#ff0000"/><rect x="152" width="8" height="80" fill="#00ff00"/></svg>');
  const encoded = await sharp(svg).png().toBuffer();
  const result = await renderChafa(encoded, 48, 24, 0.5);
  expect([result.width, result.height]).toEqual([48, 12]);
  expect(result.cells.filter(c => c.x === 0).every(c => [c.fg, c.bg].some(c => nearColor(c, '#ff0000')))).toBe(true);
  expect(result.cells.filter(c => c.x === 47).every(c => [c.fg, c.bg].some(c => nearColor(c, '#00ff00')))).toBe(true);
  expect(result.cells.some(c => !' █▀▄▌▐▖▗▘▙▚▛▜▝▞▟'.includes(c.char))).toBe(true);
});

test('Chafa skips empty viewports and rejects invalid artwork', async () => {
  expect(await renderChafa(Buffer.alloc(0), 0, 10, 0.5)).toEqual({cells: [], width: 0, height: 0});
  await expect(renderChafa(Buffer.from('invalid image'), 10, 5, 0.5)).rejects.toBeDefined();
});

test('OpenTUI displays the cached Chafa glyphs and refreshes them on resize', async () => {
  const {createTestRenderer}=await import('@opentui/core/testing');
  const {CoverRenderable}=await import('./cover');
  const source=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#143366"/><path d="M0 80L160 0L160 80Z" fill="#f3b49a"/></svg>')).png().toBuffer();
  const t=await createTestRenderer({width:60,height:30});
  try{
    const cover=new CoverRenderable(t.renderer,{id:'chafa-cover',source,width:48,height:24,protocol:'blocks'});
    t.renderer.root.add(cover);await cover.loadPromise;await t.renderOnce();
    await cover.chafaReady;await t.renderOnce();
    expect(t.captureCharFrame()).toMatch(/[▁▂▃▅▆▇╱╲◢◣◤◥]/);
    const cached=cover.chafaReady;await t.renderOnce();expect(cover.chafaReady).toBe(cached);
    cover.width=24;cover.height=12;await t.renderOnce();expect(cover.chafaReady).not.toBe(cached);
    await cover.chafaReady;await t.renderOnce();
    expect(t.captureCharFrame()).toMatch(/[▁▂▃▅▆▇╱╲◢◣◤◥]/);
  }finally{t.renderer.destroy();}
});
