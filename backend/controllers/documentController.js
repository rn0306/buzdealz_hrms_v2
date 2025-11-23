// controllers/documentController.js
const DocumentTemplate = require('../models/DocumentTemplate');
const EmailTemplate = require('../models/EmailTemplate'); // NEW: to support email templates
const { generatePdfFromHtml } = require('../utils/pdfGenerator');
const { sendMail } = require('../utils/emailService');
const Mustache = require('mustache'); // NEW: for email template rendering

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
  try {
    const templates = await DocumentTemplate.findAll({ order: [['updatedAt', 'DESC']] });
    res.json({ data: templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

async function getTemplate(req, res) {
  try {
    const { id } = req.params;
    const t = await DocumentTemplate.findByPk(id);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    res.json({ data: t });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
}

async function createTemplate(req, res) {
  try {
    const { name, category, body_html, placeholders } = req.body;
    const t = await DocumentTemplate.create({ name, category, body_html, placeholders });
    res.json({ data: t });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create template' });
  }
}

async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const t = await DocumentTemplate.findByPk(id);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    await t.update(req.body);
    res.json({ data: t });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update template' });
  }
}

async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const t = await DocumentTemplate.findByPk(id);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    await t.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
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
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${t.name || 'document'}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

/**
 * POST /api/documents/send
 * body: {
 *   template_id,           // DocumentTemplate id (for PDF)
 *   recipient_email,
 *   subject?,              // optional, if not provided -> template name
 *   data = {},             // placeholder data for document + email
 *   email_template_id?     // optional: EmailTemplate id for email body/subject
 * }
 */
async function sendDocument(req, res) {
  try {
    const { template_id, recipient_email, subject, data = {}, email_template_id } = req.body;

    if (!template_id || !recipient_email) {
      return res.status(400).json({ error: 'template_id and recipient_email are required' });
    }

    const t = await DocumentTemplate.findByPk(template_id);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    // Render document HTML for PDF
    const renderedHtml = renderTemplate(t.body_html, data);
    const pdfBuffer = await generatePdfFromHtml(renderedHtml);

    // Default subject = document template name (your choice #1)
    let mailSubject = subject || t.name || `Document from ${process.env.FROM_EMAIL}`;
    let htmlBody = `<p>Dear ${data.full_name || ''},</p><p>Please find attached the document.</p>`;

    // If email_template_id is provided, use that for email subject + body
    if (email_template_id) {
      const emailTemplate = await EmailTemplate.findByPk(email_template_id);
      if (emailTemplate) {
        const safeData = {
          full_name: data.full_name || '',
          email: recipient_email,
          ...data,
        };

        if (emailTemplate.subject) {
          mailSubject = Mustache.render(emailTemplate.subject, safeData);
        }
        if (emailTemplate.body_html) {
          htmlBody = Mustache.render(emailTemplate.body_html, safeData);
        }
      }
    }

    await sendMail({
      to: recipient_email,
      subject: mailSubject,
      html: htmlBody,
      attachments: [
        {
          filename: `${t.name || 'document'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    res.json({ success: true, message: 'Document email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send document' });
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  sendDocument,
};
