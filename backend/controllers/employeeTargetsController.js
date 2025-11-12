const db = require('../models');
const { EmployeeTarget, User, TargetsMaster } = db;

// List all employee targets
exports.getAll = async (req, res) => {
  try {
    const records = await EmployeeTarget.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'fname', 'lname', 'email'] },
        { model: TargetsMaster, as: 'target' },
        { model: User, as: 'assigner', attributes: ['id', 'fname', 'lname'] },
      ],
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    console.log('Creating EmployeeTarget with data:', data);
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
