const { Termination, User, PersonalDetail } = require('../models');

class TerminationController {
    // Terminate an intern
    static async terminateIntern(req, res) {
        try {
            const { user_id, reason } = req.body;

            if (!user_id || !reason) {
                return res.status(400).json({ error: 'Missing required fields: user_id, reason' });
            }

            const user = await User.findByPk(user_id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Check if already terminated
            const existing = await Termination.findOne({ where: { user_id } });
            if (existing) return res.status(400).json({ error: 'This intern is already terminated' });

            const termination = await Termination.create({
                user_id,
                reason,
                terminated_by: req.user.id
            });

             const details = await PersonalDetail.findOne({
                where: { user_id: termination.user_id },
            });
            if (!details) return res.status(404).json({ error: 'User data not found' });
            details.verification_status = 'Terminated';
            await details.save();

            res.status(201).json({ success: true, message: 'Intern terminated successfully', data: termination });
        } catch (err) {
            console.error('Termination error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // Get termination record for a user
    static async getTerminationByUser(req, res) {
        try {
            const { user_id } = req.params;
            const termination = await Termination.findOne({ where: { user_id } });
            res.json({ success: true, data: termination });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Check if user is terminated
    static async isTerminated(req, res) {
        try {
            const { user_id } = req.params;
            const termination = await Termination.findOne({ where: { user_id } });
            res.json({ success: true, isTerminated: !!termination, data: termination });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = TerminationController;
