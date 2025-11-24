const { PersonalDetail, User, EmailTemplate, EmailLogs } = require('../models');
const { generateLetter } = require('../utils/generateLetter');
const fs = require('fs');
const Mustache = require('mustache');
const { sendMail } = require('../utils/emailService');

/**
 * POST /api/documents/send-offer-letter
 * body: { user_id, email_template_id, recipient_email, data: {}, attachOfferLetter: true }
 */
async function sendOfferLetter(req, res) {
  try {
    const { user_id, email_template_id, recipient_email, data = {}, attachOfferLetter } = req.body;
    if (!user_id || !recipient_email) return res.status(400).json({ error: 'user_id and recipient_email required' });

    // Prepare data for template rendering
    const safeData = {
      full_name: data.full_name || data.fullName || '',
      email: data.email || recipient_email,
      phone: data.phone || '',
      designation: data.designation || '',
      joining_date: data.joining_date || data.joiningDate || '',
      duration: data.duration || '',
      issuer_name: data.issuer_name || '',
      ...data,
    };

    let attachment = null;
    let savedUrl = null;

    if (attachOfferLetter) {
      // generate letter and save file
      const { filePath, url } = await generateLetter('offer', safeData, { userId: user_id, sendEmail: false });
      savedUrl = url;

      // attach file buffer
      const pdfBuffer = await fs.promises.readFile(filePath);
      attachment = {
        filename: filePath.split('/').pop() || filePath.split('\\').pop(),
        content: pdfBuffer,
        contentType: 'application/pdf',
      };

      // Save URL to PersonalDetail
      try {
        const pd = await PersonalDetail.findOne({ where: { user_id } });
        if (pd) {
          pd.offer_letter_url = savedUrl;
          await pd.save();
        }
      } catch (e) {
        console.error('Failed to save offer URL to PersonalDetail', e);
      }
    }

    // Use EmailTemplate to render subject + body if provided
    let subject = `Document from ${process.env.FROM_EMAIL || 'HRMS'}`;
    let htmlBody = `<p>Dear ${safeData.full_name || ''},</p><p>Please find attached.</p>`;
    if (email_template_id) {
      const tpl = await EmailTemplate.findByPk(email_template_id);
      if (tpl) {
        subject = Mustache.render(tpl.subject || subject, safeData);
        htmlBody = Mustache.render(tpl.body_html || htmlBody, safeData);
      }
    }

    // Send mail with or without attachment
    const mailResult = await sendMail({
      to: recipient_email,
      subject,
      html: htmlBody,
      attachments: attachment ? [attachment] : [],
    });

    // Log email
    try {
      await EmailLogs.create({
        template_id: email_template_id || null,
        recipient_email,
        recipient_name: safeData.full_name || null,
        subject_rendered: subject,
        body_rendered: htmlBody,
        data_used: safeData,
        status: mailResult.success ? 'SENT' : 'FAILED',
        error_message: mailResult.error || null,
        sent_at: new Date(),
      });
    } catch (e) {
      console.error('Failed to log email', e);
    }

    return res.json({ success: true, message: 'Email sent', offer_url: savedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send offer letter' });
  }
}

module.exports = { sendOfferLetter };
