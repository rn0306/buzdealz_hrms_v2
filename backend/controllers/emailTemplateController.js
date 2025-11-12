// controllers/emailTemplateController.js
const  EmailTemplate  = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLogs');
const Mustache = require('mustache');
const { sendMail } = require('../utils/emailService'); 


// CREATE A NEW TEMPLATE

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, body_html, placeholders, category } = req.body;
    const created_by = req.user.id; // ✅ from auth middleware

    const newTemplate = await EmailTemplate.create({
      name,
      subject,
      body_html,
      placeholders,
      category,
      created_by,
      updated_by: created_by
    });

    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to create email template' });
  }
};


// GET ALL TEMPLATES

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['updatedAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};


// GET SINGLE TEMPLATE

exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByPk(id);
    if (!template)
      return res.status(404).json({ success: false, message: 'Template not found' });

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching template' });
  }
};

// UPDATE TEMPLATE

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body_html, placeholders, category, is_active } = req.body;
    const updated_by = req.user.id;

    const template = await EmailTemplate.findByPk(id);
    if (!template)
      return res.status(404).json({ success: false, message: 'Template not found' });

    await template.update({
      name,
      subject,
      body_html,
      placeholders,
      category,
      is_active,
      updated_by
    });

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};

// DELETE TEMPLATE

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByPk(id);
    if (!template)
      return res.status(404).json({ success: false, message: 'Template not found' });

    await template.destroy();
    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template' });
  }
};

// SEND EMAIL (using template)

exports.sendTemplatedEmail = async (req, res) => {
  try {
    const { template_id, recipient_email, recipient_name, data } = req.body;

    // 🛡️ Basic validation
    if (!template_id || !recipient_email)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const template = await EmailTemplate.findByPk(template_id);
    if (!template)
      return res.status(404).json({ success: false, message: 'Template not found' });

    // 🧠 Safe default data object
    const safeData = {
      full_name: recipient_name || '',
      email: recipient_email,
      ...((data && typeof data === 'object') ? data : {}),
    };

    // 🧩 Render using Mustache
    const subject = Mustache.render(template.subject || '(No Subject)', safeData);
    const body_html = Mustache.render(template.body_html || '', safeData);

    // 📨 Send via email service
    const emailResult = await sendMail(recipient_email, subject, body_html);

    // 🧾 Log the email attempt
    await EmailLog.create({
      template_id,
      recipient_email,
      recipient_name: recipient_name || safeData.full_name,
      subject_rendered: subject,
      body_rendered: body_html,
      data_used: safeData,
      status: emailResult.success ? 'SENT' : 'FAILED',
      error_message: emailResult.error || null,
      sent_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${recipient_email}`,
      result: emailResult
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
};