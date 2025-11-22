// services/pdfGenerator.js
const puppeteer = require('puppeteer');

/**
 * generatePdfFromHtml(html: string) => Buffer
 */
async function generatePdfFromHtml(html) {
  // Puppeteer recommended to run on server with proper chromium binary (or use chrome-aws-lambda for lambda)
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  // set a simple CSS for print if you want
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm' },
  });
  await browser.close();
  return pdfBuffer;
}

module.exports = { generatePdfFromHtml };
