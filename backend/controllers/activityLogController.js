const ActivityLog = require('../models/ActivityLog.js');
const User = require('../models/User.js');
const Role = require('../models/Role.js');
const { Op } = require('sequelize');

module.exports = {

  // ---------------------------------------------------
  // CREATE DAILY LOG (INTERN Only)
  // ---------------------------------------------------
  async create(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user.Role.code !== "INTERN") {
        return res.status(403).json({ error: "Only interns can submit logs" });
      }

      const { log_date, description, hours_spent, notes } = req.body;

      if (!log_date || !description) {
        return res.status(400).json({ error: 'log_date and description are required' });
      }

      // Check duplicate
      const exists = await ActivityLog.findOne({
        where: { user_id: req.user.id, log_date }
      });

      if (exists) {
        return res.status(400).json({ error: 'Log already submitted for this date' });
      }

      const log = await ActivityLog.create({
        user_id: req.user.id,
        log_date,
        description,
        hours_spent: hours_spent || 0,
        notes
      });

      return res.json({ message: 'Daily log submitted successfully', data: log });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  // ---------------------------------------------------
  // GET LOGS (Role-based)
  // ---------------------------------------------------
  async myLogs(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      let whereCondition = {};
      let includeUser = false;

      // ADMIN → all logs
      if (req.user.Role.code === "ADMIN") {
        includeUser = true;
      }

      // MANAGER → logs of assigned interns
      else if (req.user.Role.code === "MANAGER") {
        const interns = await User.findAll({
          where: { manager_id: req.user.id },
          include: [
            { model: Role, where: { code: "INTERN" }, attributes: [] }
          ],
          attributes: ["id"]
        });

        const internIds = interns.map(u => u.id);

        if (internIds.length === 0) return res.json([]);

        whereCondition = { user_id: { [Op.in]: internIds } };
        includeUser = true;
      }

      // INTERN → their own logs
      else if (req.user.Role.code === "INTERN") {
        whereCondition = { user_id: req.user.id };
      }

      const logs = await ActivityLog.findAll({
        where: whereCondition,
        order: [["log_date", "DESC"]],
        include: includeUser
          ? [{ model: User, attributes: ["id", "fname", "lname"] }]
          : []
      });

      const formatted = logs.map(log => {
        const plain = log.toJSON();
        if (plain.User) {
          plain.user = {
            id: plain.User.id,
            fname: plain.User.fname,
            lname: plain.User.lname,
            fullName: `${plain.User.fname} ${plain.User.lname}`
          };
          delete plain.User;
        }
        return plain;
      });

      return res.json(formatted);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // ---------------------------------------------------
  // GET LOG BY DATE
  // ---------------------------------------------------
  async getByDate(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { date } = req.params;
      let whereCondition = { log_date: date };
      let includeUser = false;

      if (req.user.Role.code === "ADMIN") {
        includeUser = true;
      }

      else if (req.user.Role.code === "MANAGER") {
        const interns = await User.findAll({
          where: { manager_id: req.user.id },
          include: [{ model: Role, where: { code: "INTERN" }, attributes: [] }],
          attributes: ["id"]
        });

        const internIds = interns.map(u => u.id);
        whereCondition.user_id = { [Op.in]: internIds };
        includeUser = true;
      }

      else {
        whereCondition.user_id = req.user.id;
      }

      const log = await ActivityLog.findOne({
        where: whereCondition,
        include: includeUser
          ? [{ model: User, attributes: ["id", "fname", "lname"] }]
          : []
      });

      if (!log) return res.status(404).json({ error: "No log found" });

      const plain = log.toJSON();
      if (plain.User) {
        plain.user = {
          id: plain.User.id,
          fname: plain.User.fname,
          lname: plain.User.lname,
          fullName: `${plain.User.fname} ${plain.User.lname}`
        };
        delete plain.User;
      }

      return res.json(plain);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // ---------------------------------------------------
  // UPDATE LOG
  // ---------------------------------------------------
  async update(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;

      const log = await ActivityLog.findOne({ where: { id } });
      if (!log) return res.status(404).json({ error: "Log not found" });

      // Interns can ONLY update their own logs
      if (req.user.Role.code === "INTERN" && log.user_id !== req.user.id) {
        return res.status(403).json({ error: "You cannot edit someone else’s logs" });
      }

      // Managers cannot update logs
      if (req.user.Role.code === "MANAGER") {
        return res.status(403).json({ error: "Managers cannot edit logs" });
      }

      const { description, hours_spent, notes } = req.body;

      await log.update({
        description: description || log.description,
        hours_spent: hours_spent ?? log.hours_spent,
        notes: notes ?? log.notes
      });

      return res.json({ message: "Log updated successfully", data: log });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  }

};
