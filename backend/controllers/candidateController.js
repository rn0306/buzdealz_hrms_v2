const { User, PersonalDetail, Role } = require('../models');

class CandidateController {
  // List users (previously candidates)
  static async list(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [
          { model: PersonalDetail, as: 'personalDetail' },
          {
            model: Role,
            as: 'Role',
            where: { code: 'INTERN' },
            attributes: ['code']
          }
        ],
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get single user by id
  static async get(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: PersonalDetail, as: 'personalDetail' }],
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

static async updateCandidate(req, res) {
  try {
    const { id } = req.params;
    const { full_name, email, phone, verification_status, date_of_birth, resume_url } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "Candidate not found" });

    const detail = await PersonalDetail.findOne({ where: { user_id: id } });
    if (!detail) return res.status(404).json({ error: "Candidate details missing" });

    // If new resume uploaded → delete old from S3
    if (resume_url && resume_url !== detail.resume_url) {
      const { deleteFileFromS3 } = require("../utils/s3Presign");
      await deleteFileFromS3(detail.resume_url);
      detail.resume_url = resume_url;
    }

    // Update user
    user.full_name = full_name || user.full_name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.date_of_birth = date_of_birth || user.date_of_birth;
    user.updated_by = req.user.id;
    await user.save();

    // Update personal details
    detail.verification_status = verification_status || detail.verification_status;
    detail.updated_by = req.user.id;
    await detail.save();

    res.json({ message: "Candidate updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


  // Delete user
  static async remove(req, res) {
    try {
      const { id } = req.params;
      let detail = await PersonalDetail.findOne({ where: { user_id: id } });
       if (!detail) return res.status(404).json({ error: 'detail not found' });
      await detail.destroy();
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await user.destroy();
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  
}

module.exports = CandidateController;
