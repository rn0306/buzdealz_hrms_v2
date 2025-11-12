const { User, PersonalDetail } = require('../models');
const { Op } = require('sequelize');

class PersonalDetailsController {
  // List all personal details
  static async list(req, res) {
    try {
      const { page = 1, limit = 50, stage, verification_status } = req.query;
      const where = {};
      if (stage) where.current_stage = stage;
      if (verification_status) where.verification_status = verification_status;

      const offset = (Number(page) - 1) * Number(limit);

      const details = await PersonalDetail.findAll({
        where,
        include: [{ model: User, as: 'user'}],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // List candidates who have filled Aadhaar & PAN
  static async listFilledCandidates(req, res) {
    try {
      const details = await PersonalDetail.findAll({
        where: {
          adhar_card_no: { [Op.ne]: null, [Op.ne]: '' },
          pan_card_no: { [Op.ne]: null, [Op.ne]: '' },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'fname', 'mname', 'lname', 'phone','joining_date','confirmation_date'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get personal details by user id
  static async get(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
      if (!user) return res.status(404).json({ error: 'Candidate (user) not found' });

      const detail = await PersonalDetail.findOne({ where: { user_id: id } });

      res.json(Object.assign({}, user.toJSON(), { personalDetail: detail }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Create personal detail
  static async create(req, res) {
    try {
      const payload = req.body || {};
      const { user_id } = payload;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });

      const user = await User.findByPk(user_id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const existing = await PersonalDetail.findOne({ where: { user_id } });
      if (existing) return res.status(400).json({ error: 'PersonalDetail already exists for this user' });

      const detail = await PersonalDetail.create({ user_id, ...payload });
      res.status(201).json(detail);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update personal detail
 
static async update(req, res) {
  try {
    const { id } = req.params; // user_id
    const payload = req.body || {};

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Candidate (user) not found' });

    let detail = await PersonalDetail.findOne({ where: { user_id: id } });
    if (!detail) {
      detail = await PersonalDetail.create({
        user_id: id,
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      });
    }

    // ✅ Allowed Personal Detail fields
    const allowedPersonalFields = [
      'adhar_card_no',
      'pan_card_no',
      'bank_name',
      'account_no',
      'branch_name',
      'ifsc_code',
      'highest_education',
      'university_name',
      'passing_year',
      'last_company_name',
      'role_designation',
      'duration',
      'other_documents_url',
      'id_proof_url',
      'verification_status',
      'verified_by',
      'verified_at',
      'source',
      'current_stage',
    ];

    for (const key of allowedPersonalFields) {
      if (payload[key] !== undefined) {
        detail[key] = payload[key];
      }
    }

    // ✅ Update User basic details
    if (payload.fname !== undefined) user.fname = payload.fname;
    if (payload.lname !== undefined) user.lname = payload.lname;
    if (payload.email !== undefined) user.email = payload.email;
    if (payload.phone !== undefined) user.phone = payload.phone;

    // ✅ Update date-related fields
    if (payload.joining_date !== undefined) user.joining_date = payload.joining_date;
    if (payload.confirmation_date !== undefined) user.confirmation_date = payload.confirmation_date;
    if (payload.date_of_birth !== undefined) user.date_of_birth = payload.date_of_birth;

    user.updated_by = req.user?.id || user.updated_by;
    detail.updated_by = req.user?.id || detail.updated_by;

    await user.save();
    await detail.save();

    res.json({
      message: 'Profile updated successfully',
      user,
      personalDetail: detail,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const detail = await PersonalDetail.findOne({ where: { user_id: id } });
      if (!detail) return res.status(404).json({ error: 'Personal detail not found' });

      await detail.destroy();
      res.json({ message: 'Personal detail deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = PersonalDetailsController;
