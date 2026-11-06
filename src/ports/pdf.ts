export interface PdfOptions {
  title: string;
  locale: string;
  direction: 'rtl' | 'ltr';
}

/**
 * Report rendering boundary. The MVP prints HTML/CSS; an automated renderer
 * can be plugged in later without touching the reports themselves.
 */
export interface PdfRenderer {
  render(markup: string, options: PdfOptions): Promise<Blob>;
}
