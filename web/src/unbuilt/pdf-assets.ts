// Resolve PDF decoder, CMap and font resources to bundled local files only.
const assets = import.meta.glob<string>('/node_modules/pdfjs-dist/{cmaps,standard_fonts,wasm}/*', { eager: true, query: '?url', import: 'default' });
export class PdfBinaryDataFactory {
  async fetch({ kind, filename }: { kind: string; filename: string }) {
    const folder = ({ cMapUrl: 'cmaps', standardFontDataUrl: 'standard_fonts', wasmUrl: 'wasm' } as Record<string, string>)[kind];
    const url = assets[`/node_modules/pdfjs-dist/${folder}/${filename}`];
    if (!url) throw Error('This PDF requires an unsupported font or image decoder resource.');
    const response = await fetch(url);
    if (!response.ok) throw Error('A local PDF rendering resource could not be loaded.');
    return new Uint8Array(await response.arrayBuffer());
  }
}
