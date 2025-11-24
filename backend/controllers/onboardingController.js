const { PersonalDetail, OfferLetter, User, Role } = require('../models');
const { Op } = require('sequelize');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { generateLetter } = require('../utils/generateLetter');
const { sendMail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');



async function generatePasswordFromName(name) {
  return name.toLowerCase().trim() + '$123';
}



function generateOnboardingToken() {
  return crypto.randomBytes(16).toString("hex");   // 32 chars
}

class OnboardingController {


  static async getPresignedResumeUrl(req, res) {
  try {
    const { fileType } = req.query;

    if (!fileType) return res.status(400).json({ error: "fileType is required" });

    const { generatePresignedUrl } = require("../utils/s3Presign");
    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileType);

    res.json({ uploadUrl, fileUrl });
  } catch (err) {
    console.error("Presign URL generation error:", err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
}

 
static async createCandidate(req, res) {
  try {
    const { full_name, email, phone, resume_url, date_of_birth } = req.body;

    if (!email || !full_name)
      return res.status(400).json({ error: "full_name and email are required" });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Candidate with this email already exists" });

    const role = await Role.findOne({ where: { code: "INTERN" } });
    if (!role) return res.status(500).json({ error: "INTERN role not found" });

    const generatedPassword = await generatePasswordFromName(full_name);
    const onboarding_token = generateOnboardingToken();

    const names = full_name.split(" ");
    const fname = names[0] || "";
    const lname = names.slice(1).join(" ") || "";

    const user = await User.create({
      email,
      password_hash: generatedPassword,
      role_id: role.id,
      fname,
      lname,
      phone: phone || null,
      date_of_birth,
      onboarding_token,
      recruiter_id: req.user.id,
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    await PersonalDetail.create({
      user_id: user.id,
      resume_url: resume_url || null,
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    res.status(201).json({
      message: "Candidate created",
      candidate: { id: user.id, full_name, email },
      user: { id: user.id, email: user.email, tempPassword: generatedPassword },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


  // HR verifies documents and updates candidate with joining date and confirmation date
  static async verifyAndUpdateCandidate(req, res) {
    try {
      const { candidateId } = req.params;

      const {
        verificationStatus,
        joiningDate,
        confirmationDate,
        rejectComment,
        work_type,
        internship_duration_months,
        internship_duration_days,
        stipend
      } = req.body;

      // Validate status
      if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
        return res.status(400).json({ error: 'Invalid verification status' });
      }

      // Fetch user
      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Candidate (user) not found' });

      // Fetch personal details
      let detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      if (!detail) return res.status(404).json({ error: 'Candidate details not found' });

      // Update verification fields
      detail.verification_status = verificationStatus;
      detail.verified_by = req.user.id;
      detail.verified_at = new Date();

      // Update editable fields
      if (work_type) detail.work_type = work_type;
      if (internship_duration_months) detail.internship_duration_months = internship_duration_months;
      if (internship_duration_days) detail.internship_duration_days = internship_duration_days;
      if (stipend) detail.stipend = stipend;

      // If rejected, store comment
      if (verificationStatus === 'REJECTED' && rejectComment) {
        detail.rejection_comment = rejectComment;
      }

      // If VERIFIED → update user and generate offer letter
      if (verificationStatus === 'VERIFIED') {
        if (joiningDate) user.joining_date = joiningDate;
        if (confirmationDate) user.confirmation_date = confirmationDate;

        user.updated_by = req.user.id;
        await user.save();

        // Prepare data for offer letter template
        const templateData = {
          full_name: `${user.fname || ''} ${user.lname || ''}`.trim(),
          email: user.email,
          phone: user.phone || '',
          joining_date: user.joining_date || joiningDate,
          internship_duration_months: detail.internship_duration_months || 0,
          internship_duration_days: detail.internship_duration_days || 0,
          work_type: detail.work_type || '',
          stipend: detail.stipend || 0,
          issuer_name: req.user && req.user.fname
            ? `${req.user.fname} ${req.user.lname || ''}`
            : 'HR Team'
        };

        try {
          const { url } = await generateLetter('offer', templateData, {
            userId: candidateId,
            sendEmail: true,
            recipientEmail: user.email,
            subject: 'Offer Letter',
            emailBody: `<p>Dear ${templateData.full_name},</p><p>Please find your offer letter attached.</p>`
          });

          await OfferLetter.create({
            user_id: candidateId,
            offer_url: url,
            issued_by: req.user.id
          });

          detail.offer_letter_url = url;
          await detail.save();

        } catch (err) {
          console.error('Offer letter generation failed:', err);
        }
      }

      detail.updated_by = req.user.id;
      await detail.save();

      res.json({
        message: `Candidate verification ${verificationStatus.toLowerCase()}`,
        candidate: {
          id: user.id,
          full_name: `${user.fname} ${user.lname}`,
          email: user.email,
          joining_date: user.joining_date,
          confirmation_date: user.confirmation_date,
          verification_status: detail.verification_status,
          work_type: detail.work_type,
          internship_duration_months: detail.internship_duration_months,
          internship_duration_days: detail.internship_duration_days,
          stipend: detail.stipend,
          offer_letter_url: detail.offer_letter_url
        }
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Authenticated accept (candidate logged in) via POST /api/onboarding/offer-accept/:candidateId
  static async acceptOfferAuthenticated(req, res) {
    try {
      const { candidateId } = req.params;
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.id !== candidateId) return res.status(403).json({ error: 'Not authorized' });

      const offer = await OfferLetter.findOne({ where: { user_id: candidateId } });
      if (!offer) return res.status(404).json({ error: 'Offer letter not found' });
      offer.accepted = true;
      offer.accepted_at = new Date();
      await offer.save();
      const detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      if (detail) {
        detail.verification_status = 'Offer Accepted';
        await detail.save();
      }
      res.json({ message: 'Offer accepted. Welcome!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // HR manually trigger sending offer
  static async sendOffer(req, res) {
    try {
      const { candidateId } = req.params;
      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Candidate not found' });

      const detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      const templateData = {
        full_name: `${user.fname || ''} ${user.lname || ''}`.trim(),
        email: user.email,
        phone: user.phone || (detail && detail.phone) || '',
        joining_date: user.joining_date || (detail && detail.joining_date) || new Date().toISOString().split('T')[0],
        designation: detail && detail.designation,
        duration: detail && detail.duration,
        issuer_name: req.user && (req.user.fname ? `${req.user.fname} ${req.user.lname || ''}` : '')
      };

      const { url } = await generateLetter('offer', templateData, {
        userId: candidateId,
        sendEmail: true,
        recipientEmail: user.email,
        subject: 'Offer Letter',
        emailBody: `<p>Dear ${templateData.full_name},</p><p>Please find your offer letter attached.</p>`
      });
      const offer = await OfferLetter.create({ user_id: candidateId, offer_url: url, issued_by: req.user.id });
      try {
        if (detail) { detail.offer_letter_url = url; await detail.save(); }
      } catch (e) { console.error('Failed saving offer URL on PersonalDetail', e); }
      res.json({ success: true, offer: offer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

  // Get latest offer for a candidate
  static async getOffer(req, res) {
    try {
      const { candidateId } = req.params;
      const offer = await OfferLetter.findOne({ where: { user_id: candidateId }, order: [['issued_at', 'DESC']] });
      if (!offer) return res.status(404).json({ error: 'Offer not found' });
      res.json({ success: true, data: offer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 5. Candidate sets/updates password using onboarding token
  static async setPassword(req, res) {
    try {
      const { candidateId } = req.params;
      const { token } = req.query;
      const { new_password } = req.body;
      if (!token) return res.status(401).json({ error: 'Onboarding token required' });
      if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'new_password required (min 6 chars)' });

      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Associated user account not found' });
      const isValid = token === user.onboarding_token;


      if (!isValid) return res.status(403).json({ error: 'Token does not match candidate' });
      user.password_hash = new_password; // beforeUpdate hook will hash it
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = OnboardingController;
