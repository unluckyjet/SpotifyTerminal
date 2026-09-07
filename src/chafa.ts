import Chafa from 'chafa-wasm';

export type ChafaCell = {x: number; y: number; char: string; fg: string; bg: string};
export type ChafaArtwork = {cells: ChafaCell[]; width: number; height: number};

type DecodedImage = {width: number; height: number; data: Uint8ClampedArray};
type ChafaModule = Awaited<ReturnType<typeof Chafa>>;
let modulePromise: Promise<ChafaModule> | undefined;

function loadChafa() {
  return modulePromise ??= Chafa().catch(error => {
    modulePromise = undefined;
    throw error;
  });
}

const color = (value: number) => `#${Math.max(0, value).toString(16).padStart(6, '0')}`;

/** Fit the complete cover into terminal cells. cellAspect is cell width / height.
 * Chafa matches edge and block glyphs in full color; callers cache track/size results.
 */
export async function renderChafa(
  encoded: Buffer,
  columns: number,
  rows: number,
  cellAspect = 0.5,
): Promise<ChafaArtwork> {
  columns = Math.floor(columns);
  rows = Math.floor(rows);
  if (!Number.isFinite(columns) || !Number.isFinite(rows) || columns < 1 || rows < 1) {
    return {cells: [], width: 0, height: 0};
  }
  if (!Number.isFinite(cellAspect) || cellAspect <= 0) cellAspect = 0.5;
  const chafa = await loadChafa();
  // A Buffer may be a view into a larger pooled allocation. Pass only its bytes.
  const bytes = Uint8Array.from(encoded).buffer;
  const decoded = await new Promise<DecodedImage>((resolve, reject) => {
    chafa.decodeImage(bytes, (error, result) => error ? reject(error) : resolve(result));
  });
  const scale = Math.min(columns * cellAspect / decoded.width, rows / decoded.height);
  const width = Math.max(1, Math.min(columns, Math.floor(decoded.width * scale / cellAspect)));
  const height = Math.max(1, Math.min(rows, Math.floor(decoded.height * scale)));
  const matrix = await new Promise<number[][][]>((resolve, reject) => {
    chafa.imageToMatrix(decoded, {
      format: 'CHAFA_PIXEL_MODE_SYMBOLS',
      width,
      height,
      fontRatio: cellAspect,
      colors: 'CHAFA_CANVAS_MODE_TRUECOLOR',
      colorExtractor: 'CHAFA_COLOR_EXTRACTOR_AVERAGE',
      symbols: 'block+border+diagonal+space-wide-inverted',
      fill: 'none',
      dither: 'CHAFA_DITHER_MODE_NONE',
      preprocess: false,
      work: 9,
    }, (error, result) => error ? reject(error) : resolve(result.matrix));
  });
  const cells: ChafaCell[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [codepoint, foreground, background] = matrix[y][x];
      // The selected repertoire contains single-cell glyphs only. Read the
      // matrix directly, so no ANSI output ever needs to touch the terminal.
      cells.push({x, y, char: String.fromCodePoint(codepoint || 32), fg: color(foreground), bg: color(background)});
    }
  }
  return {cells, width, height};
}
