const { Candidate, OnboardingDetail, OfferLetter, User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Helper: Generate onboarding token (valid for 7 days)
function generateOnboardingToken(candidateId) {
  return jwt.sign({ candidateId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Generate password from first name
function generatePasswordFromName(full_name) {
  const firstName = full_name.split(' ')[0].toLowerCase();
  return `${firstName}123$`;
}

class OnboardingController {
  // 1. HR selects candidate as "Selected" and gets onboarding link
  static async selectCandidate(req, res) {
    try {
      const { candidateId } = req.params;
      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      if (candidate.current_stage !== 'New' && candidate.current_stage !== 'Shortlisted') {
        return res.status(400).json({ error: 'Candidate already selected or onboarded' });
      }
      candidate.current_stage = 'Selected';
      await candidate.save();
      // Generate onboarding token
      const onboardingToken = generateOnboardingToken(candidate.id);
      // (In real app, send email with link)
      res.json({
        message: 'Candidate marked as Selected',
        onboarding_link: `/api/onboarding/upload/${candidate.id}?token=${onboardingToken}`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Recruiter creates a Candidate and an associated User (auto-generated password)
  static async createCandidate(req, res) {
    try {
      const { full_name, email, phone, resume_url, source, assigned_recruiter } = req.body;
      if (!email || !full_name) return res.status(400).json({ error: 'full_name and email are required' });

      // Check if candidate already exists
      let candidate = await Candidate.findOne({ where: { email } });
      if (candidate) return res.status(400).json({ error: 'Candidate with this email already exists' });

      // Create candidate
      candidate = await Candidate.create({ full_name, email, phone, resume_url, source, assigned_recruiter: assigned_recruiter || req.user.id });

      // Create user account for candidate with role INTERN
      const role = await Role.findOne({ where: { code: 'INTERN' } });
      if (!role) return res.status(500).json({ error: 'INTERN role not found' });

      // Make sure there's no existing user with same email
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(201).json({ message: 'Candidate created; user account already exists', candidate });
      }

      // Generate password using first name
      const generatedPassword = generatePasswordFromName(full_name);
      const user = await User.create({
        email,
        password_hash: generatedPassword,
        role_id: role.id,
        full_name,
        phone
      });

      // In production, email this password to the candidate securely. For now, return it in response.
      res.status(201).json({ message: 'Candidate and user created', candidate, user: { id: user.id, email: user.email, tempPassword: generatedPassword } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 2. Candidate uploads documents (with onboarding token)
  static async uploadDocuments(req, res) {
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
      // Accept document fields
      const { id_proof_url, bank_account_number, ifsc_code, pan_number, aadhaar_number } = req.body;
      let detail = await OnboardingDetail.findOne({ where: { candidate_id: candidateId } });
      if (!detail) {
        detail = await OnboardingDetail.create({
          candidate_id: candidateId,
          id_proof_url,
          bank_account_number,
          ifsc_code,
          pan_number,
          aadhaar_number,
          status: 'Pending'
        });
      } else {
        Object.assign(detail, { id_proof_url, bank_account_number, ifsc_code, pan_number, aadhaar_number, status: 'Pending' });
        await detail.save();
      }
      res.json({ message: 'Documents uploaded. Awaiting verification.' });
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
      const detail = await OnboardingDetail.findOne({ where: { candidate_id: candidateId } });
      if (!detail) return res.status(404).json({ error: 'Onboarding details not found' });
      detail.status = status;
      detail.verified_by = req.user.id;
      detail.verified_at = new Date();
      await detail.save();
      // If verified, move candidate to Onboarded and issue offer letter
      let offerLetter = null;
      if (status === 'Verified') {
        const candidate = await Candidate.findByPk(candidateId);
        candidate.current_stage = 'Onboarded';
        await candidate.save();
        offerLetter = await OfferLetter.create({
          candidate_id: candidateId,
          offer_url: `/offers/offer_${candidateId}.pdf`, // Placeholder
          issued_by: req.user.id
        });
      }
      res.json({
        message: `Documents ${status.toLowerCase()}.`,
        offer_letter: offerLetter ? offerLetter.offer_url : undefined
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

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired onboarding token' });
      }
      if (decoded.candidateId !== candidateId) return res.status(403).json({ error: 'Token does not match candidate' });

      const candidate = await Candidate.findByPk(candidateId);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      // Find user by candidate email
      const user = await User.findOne({ where: { email: candidate.email } });
      if (!user) return res.status(404).json({ error: 'Associated user account not found' });

      user.password_hash = new_password; // beforeUpdate hook will hash
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = OnboardingController;
