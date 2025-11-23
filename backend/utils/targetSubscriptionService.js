// utils/targetSubscriptionService.js
const db = require('../models');
const { Op } = require('sequelize');

// Use models exported from models/index.js. Note: the Subscription model is exported
// as `subscription` in that file, so resolve it explicitly to avoid undefined.
const EmployeeTarget = db.EmployeeTarget;
const InternSubscription = db.InternSubscription;
const TargetsMaster = db.TargetsMaster;
const Plans = db.Plans;
const Subscription = db.subscription || db.Subscription;

/**
 * ========================================
 * 1. GET ASSIGNED TARGET BY DATE RANGE
 * ========================================
 * Check the current assigned target using the start date and end date.
 */
async function getAssignedTargetByDateRange(userId, startDate, endDate) {
  try {
    const target = await EmployeeTarget.findOne({
      where: {
        user_id: userId,
        start_date: {
          [Op.lte]: endDate,
        },
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: startDate } }
        ]
      },
      include: [
        {
          model: TargetsMaster,
          as: 'target',
          attributes: ['id', 'target_description', 'plans', 'deadline_days']
        }
      ]
    });

    return target;
  } catch (error) {
    console.error('Error fetching assigned target by date range:', error);
    throw error;
  }
}

/**
 * ========================================
 * 2. GET SUBSCRIPTIONS ADDED WITHIN DATES
 * ========================================
 * Check the subscriptions that were added within those dates.
 */
async function getSubscriptionsWithinDateRange(userId, startDate, endDate) {
  try {
    // Include the master Subscription record using the association
    // `subscription_info` defined in `models/index.js` so we can access
    // verification_status without an extra query for each record.
    const subscriptions = await InternSubscription.findAll({
      where: {
        user_id: userId,
        submission_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Subscription,
          as: 'subscription_info',
          attributes: ['id', 'subscription_id', 'subscription_plan', 'verification_status'],
          required: false
        }
      ],
      order: [['submission_date', 'DESC']]
    });

    return subscriptions;
  } catch (error) {
    console.error('Error fetching subscriptions within date range:', error);
    throw error;
  }
}

/**
 * ========================================
 * 3. GET TARGET COUNTS FROM PLAN
 * ========================================
 * Get how many target counts each plan has by finding the plan name using plan ID.
 */
async function getTargetCountsFromPlan(targetsMasterId) {
  try {
    const targetsMaster = await TargetsMaster.findByPk(targetsMasterId, {
      attributes: ['id', 'plans', 'target_description']
    });

    if (!targetsMaster) {
      throw new Error(`TargetsMaster with ID ${targetsMasterId} not found`);
    }

    // plans is stored as JSON: { plan_id: count }
    // We need to map plan IDs to plan names and return the structure
    const plansData = targetsMaster.plans || {};
    const enrichedPlans = {};

    // Fetch all plans to map IDs to names
    const allPlans = await Plans.findAll({
      attributes: ['id', 'plan_name'],
      where: {
        id: Object.keys(plansData)
      }
    });

    // Create a mapping of plan_id -> plan_name
    const planIdToName = {};
    allPlans.forEach(plan => {
      planIdToName[plan.id] = plan.plan_name;
    });

    // Enrich the plans data with plan names
    for (const [planId, count] of Object.entries(plansData)) {
      const planName = planIdToName[planId] || 'Unknown Plan';
      enrichedPlans[planName] = {
        plan_id: planId,
        target_count: count
      };
    }

    return {
      target_id: targetsMasterId,
      plans: enrichedPlans
    };
  } catch (error) {
    console.error('Error fetching target counts from plan:', error);
    throw error;
  }
}

/**
 * ========================================
 * 4. COUNT VERIFIED SUBSCRIPTIONS
 * ========================================
 * Within the start and end date, check how many subscriptions were verified.
 */
async function countVerifiedSubscriptionsWithinRange(subscriptions) {
  try {
    let verifiedCount = 0;
    const verifiedSubscriptions = [];

    for (const subscription of subscriptions) {
      // Prefer the eager-loaded master subscription (alias: subscription_info)
      // if present; otherwise fall back to a lookup.
      let relatedSubscription = null;
      if (subscription.subscription_info) {
        relatedSubscription = subscription.subscription_info;
      } else {
        relatedSubscription = await Subscription.findOne({
          where: { subscription_id: subscription.subscription_id }
        });
      }

      if (relatedSubscription && relatedSubscription.verification_status === 'Verified') {
        verifiedCount++;
        verifiedSubscriptions.push({
          id: subscription.id,
          subscription_id: subscription.subscription_id,
          subscription_plan: subscription.subscription_plan,
          submission_date: subscription.submission_date,
          validation_status: subscription.validation_status
        });
      }
    }

    return {
      total_count: subscriptions.length,
      verified_count: verifiedCount,
      verified_subscriptions: verifiedSubscriptions
    };
  } catch (error) {
    console.error('Error counting verified subscriptions:', error);
    throw error;
  }
}

/**
 * ========================================
 * 5. CHECK IF TARGET IS COMPLETED
 * ========================================
 * Check if the target is completed based on verification count vs target count.
 */
async function isTargetCompleted(targetsMasterId, verifiedCount) {
  try {
    const targetsMaster = await TargetsMaster.findByPk(targetsMasterId, {
      attributes: ['plans']
    });

    if (!targetsMaster) {
      throw new Error(`TargetsMaster with ID ${targetsMasterId} not found`);
    }

    // Calculate total target count from all plans
    const plansData = targetsMaster.plans || {};
    let totalTargetCount = 0;

    for (const count of Object.values(plansData)) {
      totalTargetCount += count;
    }

    // Target is completed if verified count >= total target count
    const isCompleted = verifiedCount >= totalTargetCount;

    return {
      is_completed: isCompleted,
      verified_count: verifiedCount,
      required_count: totalTargetCount
    };
  } catch (error) {
    console.error('Error checking if target is completed:', error);
    throw error;
  }
}

/**
 * ========================================
 * 6. UPDATE TARGET STATUS
 * ========================================
 * Update target status based on completion and overdue logic.
 */
async function updateTargetStatus(employeeTargetId, isCompleted, endDate) {
  try {
    const employeeTarget = await EmployeeTarget.findByPk(employeeTargetId);

    if (!employeeTarget) {
      throw new Error(`EmployeeTarget with ID ${employeeTargetId} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStatus = employeeTarget.status;

    // If target is completed when submitting the latest subscription
    if (isCompleted) {
      newStatus = 'Completed';
    }
    // If the end date has passed and the target is not completed
    else if (endDate && new Date(endDate) < today && employeeTarget.status !== 'Completed') {
      newStatus = 'Overdue';
    }

    // Update if status changed
    if (newStatus !== employeeTarget.status) {
      await employeeTarget.update({ status: newStatus });
    }

    return {
      employee_target_id: employeeTargetId,
      previous_status: employeeTarget.status,
      new_status: newStatus,
      updated: newStatus !== employeeTarget.status
    };
  } catch (error) {
    console.error('Error updating target status:', error);
    throw error;
  }
}

/**
 * ========================================
 * 7. VALIDATE AND PROCESS SUBSCRIPTION
 * ========================================
 * Main function to validate subscription addition and update target status.
 */
async function validateAndProcessSubscription(userId, subscriptionId, startDate, endDate) {
  try {
    // Step 1: Get the assigned target by date range
    const assignedTarget = await getAssignedTargetByDateRange(userId, startDate, endDate);

    if (!assignedTarget) {
      return {
        success: false,
        error: 'No assigned target found for the given date range',
        code: 'NO_TARGET_FOUND'
      };
    }

    // Step 2: Get subscriptions added within the date range
    const subscriptionsInRange = await getSubscriptionsWithinDateRange(
      userId,
      assignedTarget.start_date,
      assignedTarget.end_date || endDate
    );

    // Step 3: Get target counts from plan
    const planCounts = await getTargetCountsFromPlan(assignedTarget.target_id);

    // Step 4: Count verified subscriptions
    const verificationData = await countVerifiedSubscriptionsWithinRange(subscriptionsInRange);

    // Step 5: Check if target is completed
    const completionData = await isTargetCompleted(
      assignedTarget.target_id,
      verificationData.verified_count
    );

    // Step 6: Update target status if needed
    const statusUpdate = await updateTargetStatus(
      assignedTarget.id,
      completionData.is_completed,
      assignedTarget.end_date
    );

    return {
      success: true,
      target_details: {
        target_id: assignedTarget.id,
        target_description: assignedTarget.target.target_description,
        start_date: assignedTarget.start_date,
        end_date: assignedTarget.end_date
      },
      plan_counts: planCounts.plans,
      subscription_statistics: {
        total_in_range: verificationData.total_count,
        verified_count: verificationData.verified_count,
        required_count: completionData.required_count
      },
      target_completion: {
        is_completed: completionData.is_completed,
        previous_status: statusUpdate.previous_status,
        new_status: statusUpdate.new_status,
        status_updated: statusUpdate.updated
      }
    };
  } catch (error) {
    console.error('Error in validateAndProcessSubscription:', error);
    return {
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR'
    };
  }
}

module.exports = {
  getAssignedTargetByDateRange,
  getSubscriptionsWithinDateRange,
  getTargetCountsFromPlan,
  countVerifiedSubscriptionsWithinRange,
  isTargetCompleted,
  updateTargetStatus,
  validateAndProcessSubscription
};
