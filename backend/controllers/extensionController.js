const { Extension, User, PersonalDetail } = require('../models');

class ExtensionController {
    // Request extension for an intern
    static async requestExtension(req, res) {
        try {
            const { user_id, reason, old_end_date, new_end_date } = req.body;

            if (!user_id || !reason || !new_end_date) {
                return res.status(400).json({ error: 'Missing required fields: user_id, reason, old_end_date, new_end_date' });
            }

            const user = await User.findByPk(user_id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const extension = await Extension.create({
                user_id,
                reason,
                old_end_date,
                new_end_date,
                requested_by: req.user.id,
                status: 'Pending'
            });

            res.status(201).json({ success: true, message: 'Extension requested successfully', data: extension });
        } catch (err) {
            console.error('Extension request error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // Get extensions for a specific user
    static async getExtensionsByUser(req, res) {
        try {
            const { user_id } = req.params;
            const extensions = await Extension.findAll({ where: { user_id }, order: [['created_at', 'DESC']] });
            res.json({ success: true, data: extensions });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Approve or reject extension
    static async updateExtensionStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({ error: 'Status must be Approved or Rejected' });
            }

            const extension = await Extension.findByPk(id);
            if (!extension) return res.status(404).json({ error: 'Extension not found' });
            const user = await PersonalDetail.findOne({
                where: { user_id: extension.user_id },
            });
            if (!user) return res.status(404).json({ error: 'User not found' });

            if (status === 'Approved') {
                user.internship_duration_days += Math.ceil((new Date(extension.new_end_date) - new Date(extension.old_end_date)) / (1000 * 60 * 60 * 24));
                await user.save();
            }

            extension.status = status;
            extension.approved_by = req.user.id;
            await extension.save();

            res.json({ success: true, message: `Extension ${status.toLowerCase()}`, data: extension });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = ExtensionController;
