export interface SurveyRaster { file: File; url: string; name: string; width: number; height: number; page: number; pages: number; fingerprint: string }
// File identity is for accidental reattachment checks, not authentication.
export async function readSurvey(file: File, requestedPage = 1): Promise<SurveyRaster> {
  if (file.size > 20_000_000 || file.size === 0) throw Error('Choose a non-empty survey file up to 20 MB.');
  const data = new Uint8Array(await file.arrayBuffer());
  let h1 = 0x811c9dc5, h2 = 0x9e3779b9;
  for (const b of data) { h1 = Math.imul(h1 ^ b, 16777619); h2 = Math.imul(h2 ^ b, 2246822519); }
  const fingerprint = `${file.size}-${(h1 >>> 0).toString(16)}-${(h2 >>> 0).toString(16)}`;
  const isPdf = String.fromCharCode(...data.slice(0, 5)) === '%PDF-';
  const png = data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71 && data[4] === 13 && data[5] === 10 && data[6] === 26 && data[7] === 10;
  const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  if (isPdf) {
    const pdf = await import('pdfjs-dist');
    pdf.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    const { PdfBinaryDataFactory } = await import('./pdf-assets');
    const loading = pdf.getDocument({ data, enableXfa: false, useSystemFonts: false, useWorkerFetch: false, BinaryDataFactory: PdfBinaryDataFactory, stopAtErrors: true, canvasMaxAreaInBytes: 20e6 });
    try {
      const doc = await loading.promise;
      if (requestedPage < 1 || requestedPage > doc.numPages || !Number.isInteger(requestedPage)) throw Error(`Choose a page from 1 to ${doc.numPages}.`);
      const page = await doc.getPage(requestedPage), initial = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(3, 2200 / Math.max(initial.width, initial.height)) });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      if (canvas.width < 1 || canvas.height < 1 || canvas.width * canvas.height > 20e6) throw Error('PDF page dimensions are unsupported.');
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('PDF page could not be rendered.')), 'image/png'));
      return { file, url: URL.createObjectURL(blob), name: file.name.slice(0, 200), page: requestedPage, pages: doc.numPages, width: canvas.width, height: canvas.height, fingerprint };
    } catch (error) { if (error instanceof Error && error.name === 'PasswordException') throw Error('Unlock the password-protected PDF before importing it.'); throw error; } finally { await loading.destroy(); }
  }
  if (!png && !jpeg) throw Error('Unsupported survey. Choose a PDF, PNG or JPEG file; DWG, SVG and other image formats are not supported.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    if (image.naturalWidth * image.naturalHeight > 20e6) throw Error('Survey images must contain no more than 20 megapixels.');
    return { file, url, name: file.name.slice(0, 200), width: image.naturalWidth, height: image.naturalHeight, page: 1, pages: 1, fingerprint };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}
