import html2pdf from 'html2pdf.js';
import { downloadHtmlAsPdf } from './pdfExporter';

/**
 * Universal PDF Generator utilities for Kokanastha Store ERP.
 * Generates high quality PDF files from invoice HTML templates (A4 Bill of Supply & 3-Inch Thermal).
 */

export { downloadHtmlAsPdf } from './pdfExporter';

export async function generatePDF(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

export async function generatePdf(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

export async function exportToPDF(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

export async function exportToPdf(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

export async function downloadPdf(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

export async function downloadPDF(
  htmlContent: string,
  filename: string = 'Invoice.pdf',
  is3Inch: boolean = false
): Promise<void> {
  return downloadHtmlAsPdf(htmlContent, filename, is3Inch);
}

const pdfGenerator = {
  downloadHtmlAsPdf,
  generatePDF,
  generatePdf,
  exportToPDF,
  exportToPdf,
  downloadPdf,
  downloadPDF
};

export default pdfGenerator;
