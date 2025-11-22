const { PersonalDetail, OfferLetter, User, Role } = require('../models');
const { Op } = require('sequelize');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");



async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 12);
}


function generateOnboardingToken() {
  return crypto.randomBytes(16).toString("hex");   // 32 chars
}

class OnboardingController {
  // 1. HR selects candidate as "Selected" and gets onboarding link
  static async selectCandidate(req, res) {
    try {
      const { candidateId } = req.params;
      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Candidate (user) not found' });

      let detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      if (!detail) {
        detail = await PersonalDetail.create({ user_id: candidateId, current_stage: 'Selected', created_by: req.user.id, updated_by: req.user.id });
      } else {
        if (detail.current_stage !== 'New' && detail.current_stage !== 'Shortlisted') {
          return res.status(400).json({ error: 'Candidate already selected or onboarded' });
        }
        detail.current_stage = 'Selected';
        await detail.save();
      }
      // Generate onboarding token
      const onboardingToken = generateOnboardingToken();
      // (In real app, send email with link)
      res.json({
        message: 'Candidate marked as Selected',
        onboarding_link: `/api/onboarding/upload/${candidateId}?token=${onboardingToken}`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Recruiter creates a Candidate and an associated User (auto-generated password)
  static async createCandidate(req, res) {
    try {
      const { full_name, email, phone, resume_url, source, assigned_recruiter, date_of_birth } = req.body;
      if (!email || !full_name) return res.status(400).json({ error: 'full_name and email are required' });

      // Make sure there's no existing user with same email
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(400).json({ error: 'Candidate with this email already exists' });

      // Create user account for candidate with role INTERN
      const role = await Role.findOne({ where: { code: 'INTERN' } });
      if (!role) return res.status(500).json({ error: 'INTERN role not found' });

      // Generate password using first name
      const generatedPassword = generatePasswordFromName(full_name);
      const onboarding_token = generateOnboardingToken(req.user_id);

      const names = full_name.split(' ');
      const fname = names[0] || '';
      const lname = names.slice(1).join(' ') || '';

      const user = await User.create({
        email,
        password_hash: generatedPassword,
        role_id: role.id,
        fname,
        mname: null,
        lname,
        phone: phone || null,
        date_of_birth,
        onboarding_token,
        recruiter_id: assigned_recruiter || req.user.id,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      // Create PersonalDetail record with resume/source
      const detail = await PersonalDetail.create({
        user_id: user.id,
        resume_url: resume_url || null,
        created_by: req.user.id,
        updated_by: req.user.id
      });

      // In production, email this password to the candidate securely. For now, return it in response.
      res.status(201).json({ message: 'Candidate and user created', candidate: { id: user.id, full_name, email }, user: { id: user.id, email: user.email, tempPassword: generatedPassword } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }


  // 3. HR verifies documents
  static async verifyDocuments(req, res) {
    try {
      const { candidateId } = req.params;
      const { status } = req.body; // 'Verified' or 'Rejected'
      if (!['Verified', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Onboarding user not found' });

      let detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      if (!detail) return res.status(404).json({ error: 'Onboarding details not found' });

      detail.verification_status = status;
      detail.verified_by = req.user.id;
      detail.verified_at = new Date();
      await detail.save();

      // If verified, move to Onboarded and issue offer letter
      let offerLetter = null;
      if (status === 'Verified') {
        detail.current_stage = 'Onboarded';
        await detail.save();
        offerLetter = await OfferLetter.create({
          candidate_id: candidateId,
          offer_url: `/offers/offer_${candidateId}.pdf`, // Placeholder
          issued_by: req.user.id
        });
      }

      res.json({ message: `Documents ${status.toLowerCase()}.`, offer_letter: offerLetter ? offerLetter.offer_url : undefined });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 3b. HR verifies documents and updates candidate details (joining date, confirmation date)
  static async verifyAndUpdateCandidate(req, res) {
    try {
      const { candidateId } = req.params;
      const { verificationStatus, joiningDate, confirmationDate, rejectComment } = req.body;
      // Validate inputs
      if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
        return res.status(400).json({ error: 'Invalid verification status' });
      }

      // Find user
      const user = await User.findByPk(candidateId);
      if (!user) return res.status(404).json({ error: 'Candidate (user) not found' });

      // Find personal detail
      let detail = await PersonalDetail.findOne({ where: { user_id: candidateId } });
      if (!detail) return res.status(404).json({ error: 'Candidate details not found' });

      // Update verification status
      detail.verification_status = verificationStatus == 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
      detail.verified_by = req.user.id;
      detail.verified_at = new Date();

      // Store rejection comment if rejected
      if (verificationStatus === 'REJECTED' && rejectComment) {
        detail.rejection_comment = rejectComment;
      }

      // Update user with joining date and confirmation date if accepted
      if (verificationStatus === 'VERIFIED') {
        if (joiningDate) {
          user.joining_date = joiningDate;
        }
        if (confirmationDate) {
          user.confirmation_date = confirmationDate;
        }
        user.updated_by = req.user.id;
        await user.save();

        // Update personal detail stage to Onboarded
        detail.current_stage = 'Onboarded';

        // Create offer letter (placeholder URL)
        // await OfferLetter.create({
        //   candidate_id: candidateId,
        //   offer_url: `/offers/offer_${candidateId}.pdf`,
        //   issued_by: req.user.id
        // });
      } else {
        // If rejected, update stage accordingly
        detail.current_stage = 'Rejected';
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
          current_stage: detail.current_stage
        }
      });

    } catch (err) {

      res.status(500).json({ error: err.message });
    }
  }

  // 4. Candidate accepts offer
  static async acceptOffer(req, res) {
    try {
      const { candidateId } = req.params;
      const { token } = req.query;
      if (!token) return res.status(401).json({ error: 'Onboarding token required' });
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired onboarding token' });
      }
      if (decoded.candidateId !== candidateId) return res.status(403).json({ error: 'Token does not match candidate' });
      const offer = await OfferLetter.findOne({ where: { candidate_id: candidateId } });
      if (!offer) return res.status(404).json({ error: 'Offer letter not found' });
      offer.accepted = true;
      offer.accepted_at = new Date();
      await offer.save();
      res.json({ message: 'Offer accepted. Welcome!' });
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
      const isValid =  token === user.onboarding_token;


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
