// controllers/documentController.js
const DocumentTemplate = require('../models/DocumentTemplate');
const { generatePdfFromHtml } = require('../utils/pdfGenerator');
// const { sendMail } = require('../services/mailer');

/**
 * Helper: simple placeholder replacement
 * templateHtml: string
 * data: object mapping keys -> values (e.g. { full_name: 'John' })
 */
function renderTemplate(templateHtml, data) {
  if (!templateHtml) return '';
  let out = String(templateHtml);
  // replace tokens like {{full_name}} globally
  Object.keys(data || {}).forEach((k) => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    out = out.replace(re, data[k] ?? '');
  });
  return out;
}

async function listTemplates(req, res) {
  const templates = await DocumentTemplate.findAll({ order: [['updatedAt', 'DESC']] });
  res.json({ data: templates });
}

async function getTemplate(req, res) {
  const { id } = req.params;
  const t = await DocumentTemplate.findByPk(id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  res.json({ data: t });
}

async function createTemplate(req, res) {
  const { name, category, body_html, placeholders } = req.body;
  const t = await DocumentTemplate.create({ name, category, body_html, placeholders });
  res.json({ data: t });
}

async function updateTemplate(req, res) {
  const { id } = req.params;
  const t = await DocumentTemplate.findByPk(id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  await t.update(req.body);
  res.json({ data: t });
}

async function deleteTemplate(req, res) {
  const { id } = req.params;
  const t = await DocumentTemplate.findByPk(id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  await t.destroy();
  res.json({ success: true });
}

/**
 * POST /api/documents/generate
 * body: { template_id, data } -> returns pdf buffer
 */
async function generateDocument(req, res) {
  console.log('Generating document request received');
  try {
    const { template_id, data = {} } = req.body;
    console.log('Generating document with data:', data);
    const t = await DocumentTemplate.findByPk(template_id);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    const renderedHtml = renderTemplate(t.body_html, data);

    const pdfBuffer = await generatePdfFromHtml(renderedHtml);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${t.name || 'document'}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

// /**
//  * POST /api/documents/send
//  * body: { template_id, recipient_email, subject?, data }
//  */
// async function sendDocument(req, res) {
//   try {
//     const { template_id, recipient_email, subject, data = {} } = req.body;
//     const t = await DocumentTemplate.findByPk(template_id);
//     if (!t) return res.status(404).json({ error: 'Template not found' });

//     const renderedHtml = renderTemplate(t.body_html, data);
//     const pdfBuffer = await generatePdfFromHtml(renderedHtml);

//     const mailSubject = subject || `Document from ${process.env.FROM_EMAIL}`;
//     const htmlBody = `<p>Dear ${data.full_name || ''},</p><p>Please find attached the document.</p>`;

//     await sendMail({
//       to: recipient_email,
//       subject: mailSubject,
//       html: htmlBody,
//       attachments: [
//         {
//           filename: `${t.name || 'document'}.pdf`,
//           content: pdfBuffer,
//           contentType: 'application/pdf',
//         },
//       ],
//     });

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to send document' });
//   }
// }

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
//   sendDocument,
};
