/** Browser-only URL for PDF.js 6 worker; Webpack emits the asset alongside the app. */
export function pdfWorkerUrl(): string {
  return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}
