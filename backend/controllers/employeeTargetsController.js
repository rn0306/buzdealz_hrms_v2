const db = require('../models');
const { EmployeeTarget, User, TargetsMaster } = db;
const { Op } = require('sequelize');

// List all employee targets
exports.getAll = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const roleCode = req.user.Role?.code || (await db.Role.findByPk(req.user.role_id).then(r => r.code));
    let whereCondition = {};

    // -------------------------------
    // INTERN → Only their own targets
    // -------------------------------
    if (roleCode === "INTERN") {
      whereCondition = { user_id: req.user.id };
    }

    // --------------------------------------------------------
    // MANAGER → Only targets of interns assigned to the manager
    // --------------------------------------------------------
    else if (roleCode === "MANAGER") {
      const interns = await User.findAll({
        where: { manager_id: req.user.id },
        include: [
          { model: db.Role, where: { code: "INTERN" }, attributes: [] }
        ],
        attributes: ["id"],
      });

      const internIds = interns.map(i => i.id);

      if (!internIds.length) {
        return res.json([]);  // No interns → no targets
      }

      whereCondition = { user_id: { [Op.in]: internIds } };
    }

    // --------------------
    // ADMIN → All records
    // No whereCondition
    // --------------------

    const records = await EmployeeTarget.findAll({
      where: whereCondition,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fname', 'lname', 'email'] },
        { model: TargetsMaster, as: 'target' },
        { model: User, as: 'assigner', attributes: ['id', 'fname', 'lname'] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json(records);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Get by id
exports.getById = async (req, res) => {
  try {
    const record = await EmployeeTarget.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fname', 'lname', 'email'] },
        { model: TargetsMaster, as: 'target' },
        { model: User, as: 'assigner', attributes: ['id', 'fname', 'lname'] },
      ],
    });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create
exports.create = async (req, res) => {
  try {
     const assigned_by = req.user?.id || null; // or fallback if not logged in
    const data = { ...req.body, assigned_by };
    const created = await EmployeeTarget.create(data);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating EmployeeTarget:', err);
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.update = async (req, res) => {
  try {
    const record = await EmployeeTarget.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.delete = async (req, res) => {
  try {
    const record = await EmployeeTarget.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    await record.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
