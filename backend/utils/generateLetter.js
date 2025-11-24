const path = require('path');
const fs = require('fs');
const Mustache = require('mustache');
const { generatePdfFromHtml } = require('./pdfGenerator');
const { uploadToS3 } = require('./s3Upload');

async function generateLetter(type, data = {}, options = {}) {
  const allowed = ['offer','internship','experience','appointment','joining','rejection','confirmation'];
  if (!allowed.includes(type)) throw new Error('Unsupported letter type: ' + type);

  // Load HTML template
  const templatesDir = path.join(__dirname, '..', 'templates');
  const tplPath = path.join(templatesDir, `${type}.html`);

  if (!fs.existsSync(tplPath)) {
    throw new Error(`Template not found: ${tplPath}`);
  }

  const tpl = await fs.promises.readFile(tplPath, 'utf8');

  // Render HTML
  const rendered = Mustache.render(tpl, data);

  // Generate PDF buffer
  const pdfBuffer = await generatePdfFromHtml(rendered);

  // Create S3 key (folder + filename)
  const key = `letters/${type}_${options.userId || Date.now()}.pdf`;

  // Upload to S3
  const url = await uploadToS3(pdfBuffer, key, "application/pdf");

  return { url, key };
}

module.exports = { generateLetter };
