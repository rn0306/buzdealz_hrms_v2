// backend/controllers/plansController.js
const { Plans } = require('../models');

async function listPlans(req, res) {
  try {
    const plans = await Plans.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ data: plans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

async function getPlan(req, res) {
  try {
    const plan = await Plans.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    return res.json({ data: plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch plan' });
  }
}

async function createPlan(req, res) {
  try {
    const { plan_name, status = 'Active' } = req.body;
    if (!plan_name || !plan_name.trim()) {
      return res.status(400).json({ error: 'plan_name is required' });
    }
    const plan = await Plans.create({ plan_name: plan_name.trim(), status});
    return res.status(201).json({ data: plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create plan' });
  }
}

async function updatePlan(req, res) {
  try {
    const plan = await Plans.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const { plan_name, plan_value, status } = req.body;
    if (plan_name !== undefined) plan.plan_name = plan_name;
    if (status !== undefined) plan.status = status;

    await plan.save();
    return res.json({ data: plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update plan' });
  }
}

async function deletePlan(req, res) {
  try {
    const plan = await Plans.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    await plan.destroy();
    return res.json({ message: 'Plan deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete plan' });
  }
}

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};
