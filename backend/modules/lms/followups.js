const express = require('express');
const router = express.Router();
const { FollowUp, Lead, User } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../middleware/scopeEnforcer');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination } = require('../../utils/helpers');
const mongoose = require('mongoose');

// Middleware applied to all routes
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Helper: build client query
const buildQuery = (req) => {
    const q = {};
    if (req.client?.id) q.client_id = req.client.id;
    return q;
};

/**
 * @route GET /api/followups
 * @desc List follow-ups for client, with optional filters
 */
router.get('/', async (req, res, next) => {
    try {
        const { lead_id, status, date_from, date_to, page, limit } = req.query;
        const query = buildQuery(req);

        if (lead_id) query.lead_id = lead_id;
        if (status) query.status = status;
        if (date_from || date_to) {
            query.follow_up_date = {};
            if (date_from) query.follow_up_date.$gte = new Date(date_from);
            if (date_to) query.follow_up_date.$lte = new Date(date_to);
        }

        const skip = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50);
        const limitVal = parseInt(limit) || 50;

        const [followUps, total] = await Promise.all([
            FollowUp.find(query)
                .populate({ path: 'lead_id', select: 'name email phone stage status' })
                .populate({ path: 'scheduled_by', select: 'name email' })
                .sort({ follow_up_date: 1 })
                .skip(skip)
                .limit(limitVal),
            FollowUp.countDocuments(query)
        ]);

        // Stats
        const [pending, completed, rescheduled] = await Promise.all([
            FollowUp.countDocuments({ ...buildQuery(req), status: 'Pending' }),
            FollowUp.countDocuments({ ...buildQuery(req), status: 'Completed' }),
            FollowUp.countDocuments({ ...buildQuery(req), status: 'Rescheduled' }),
        ]);

        const now = new Date();
        const overdue = await FollowUp.countDocuments({
            ...buildQuery(req),
            status: 'Pending',
            follow_up_date: { $lt: now }
        });

        res.json({
            success: true,
            data: followUps,
            meta: {
                total,
                page: parseInt(page) || 1,
                limit: limitVal,
                stats: { pending, completed, rescheduled, overdue }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/followups
 * @desc Create a new follow-up for a lead
 */
router.post('/',
    auditAction('create', 'followup'),
    async (req, res, next) => {
        try {
            const { lead_id, follow_up_date, follow_up_time, notes, reminder_minutes } = req.body;

            if (!lead_id) throw ApiError.badRequest('lead_id is required');
            if (!follow_up_date) throw ApiError.badRequest('follow_up_date is required');
            if (!follow_up_time) throw ApiError.badRequest('follow_up_time is required');

            // Verify the lead belongs to this client
            const leadQuery = { _id: lead_id };
            if (req.client?.id) leadQuery.client_id = req.client.id;
            const lead = await Lead.findOne(leadQuery);
            if (!lead) throw ApiError.notFound('Lead not found');

            const client_id = req.client?.id || lead.client_id;

            const followUp = await FollowUp.create({
                client_id,
                lead_id,
                scheduled_by: req.user.id,
                follow_up_date: new Date(follow_up_date),
                follow_up_time,
                notes: notes || '',
                reminder_minutes: reminder_minutes || null,
                status: 'Pending'
            });

            // Log activity to lead
            lead.activity_logs.push({
                type: 'note',
                content: `Follow-up scheduled for ${new Date(follow_up_date).toLocaleDateString()} at ${follow_up_time}${notes ? ': ' + notes : ''}`,
                user_id: req.user.id,
                created_at: new Date()
            });
            await lead.save();

            const populated = await FollowUp.findById(followUp._id)
                .populate({ path: 'lead_id', select: 'name email phone stage status' })
                .populate({ path: 'scheduled_by', select: 'name email' });

            res.status(201).json({ success: true, data: populated });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/followups/:id
 * @desc Get a single follow-up
 */
router.get('/:id', async (req, res, next) => {
    try {
        const query = { _id: req.params.id, ...buildQuery(req) };
        const followUp = await FollowUp.findOne(query)
            .populate({ path: 'lead_id', select: 'name email phone stage status' })
            .populate({ path: 'scheduled_by', select: 'name email' });

        if (!followUp) throw ApiError.notFound('Follow-up not found');
        res.json({ success: true, data: followUp });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/followups/:id
 * @desc Edit a follow-up (date, time, notes, reminder)
 */
router.put('/:id',
    auditAction('update', 'followup'),
    async (req, res, next) => {
        try {
            const query = { _id: req.params.id };
            if (req.client?.id) query.client_id = req.client.id;

            const followUp = await FollowUp.findOne(query);
            if (!followUp) throw ApiError.notFound('Follow-up not found');

            const { follow_up_date, follow_up_time, notes, reminder_minutes } = req.body;
            if (follow_up_date !== undefined) followUp.follow_up_date = new Date(follow_up_date);
            if (follow_up_time !== undefined) followUp.follow_up_time = follow_up_time;
            if (notes !== undefined) followUp.notes = notes;
            if (reminder_minutes !== undefined) followUp.reminder_minutes = reminder_minutes;

            await followUp.save();

            const populated = await FollowUp.findById(followUp._id)
                .populate({ path: 'lead_id', select: 'name email phone stage status' })
                .populate({ path: 'scheduled_by', select: 'name email' });

            res.json({ success: true, data: populated });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PATCH /api/followups/:id/status
 * @desc Update follow-up status (Completed / Rescheduled / Pending)
 */
router.patch('/:id/status',
    auditAction('update', 'followup'),
    async (req, res, next) => {
        try {
            const query = { _id: req.params.id };
            if (req.client?.id) query.client_id = req.client.id;

            const followUp = await FollowUp.findOne(query);
            if (!followUp) throw ApiError.notFound('Follow-up not found');

            const { status } = req.body;
            if (!['Pending', 'Completed', 'Rescheduled'].includes(status)) {
                throw ApiError.badRequest('Invalid status value');
            }

            const oldStatus = followUp.status;
            followUp.status = status;
            if (status === 'Completed') {
                followUp.completed_at = new Date();
            }
            await followUp.save();

            // Log activity to lead
            const lead = await Lead.findById(followUp.lead_id);
            if (lead && oldStatus !== status) {
                lead.activity_logs.push({
                    type: 'status_change',
                    content: `Follow-up status changed from ${oldStatus} to ${status}`,
                    user_id: req.user.id,
                    created_at: new Date()
                });
                await lead.save();
            }

            const populated = await FollowUp.findById(followUp._id)
                .populate({ path: 'lead_id', select: 'name email phone stage status' })
                .populate({ path: 'scheduled_by', select: 'name email' });

            res.json({ success: true, data: populated });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/followups/:id
 * @desc Delete a follow-up
 */
router.delete('/:id',
    auditAction('delete', 'followup'),
    async (req, res, next) => {
        try {
            const query = { _id: req.params.id };
            if (req.client?.id) query.client_id = req.client.id;

            const followUp = await FollowUp.findOne(query);
            if (!followUp) throw ApiError.notFound('Follow-up not found');

            await followUp.deleteOne();
            res.json({ success: true, message: 'Follow-up deleted' });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
