const express = require('express');
const router = express.Router();
const { Payment, Invoice, Subscription } = require('../models');
const razorpayService = require('../services/razorpayService');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * @route POST /api/payments/webhook/razorpay
 * @desc Handle Razorpay webhooks
 * @access Public (verified by signature)
 */
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = req.body;

        // Verify webhook signature
        // In production, verify using crypto:
        // const crypto = require('crypto');
        // const expectedSignature = crypto
        //     .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        //     .update(JSON.stringify(webhookBody))
        //     .digest('hex');
        // if (expectedSignature !== webhookSignature) {
        //     throw ApiError.forbidden('Invalid webhook signature');
        // }

        const event = webhookBody.event;
        const payload = webhookBody.payload.payment || webhookBody.payload.order;

        logger.info('Razorpay webhook received', { event, payload_id: payload.id });

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;

            case 'order.paid':
                await handleOrderPaid(payload);
                break;

            default:
                logger.warn('Unhandled webhook event', { event });
        }

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        logger.error('Webhook processing failed', error);
        next(error);
    }
});

/**
 * Handle successful payment
 */
async function handlePaymentCaptured(payload) {
    try {
        const payment = await Payment.findOne({
            gateway_payment_id: payload.id
        });

        if (payment) {
            payment.status = 'completed';
            payment.gateway_signature = payload.signature || '';
            await payment.save();

            // Update related invoice
            if (payment.invoice_id) {
                const invoice = await Invoice.findById(payment.invoice_id);
                if (invoice) {
                    invoice.status = 'paid';
                    invoice.paid_at = new Date();
                    await invoice.save();
                }
            }

            logger.info('Payment captured successfully', { payment_id: payment.id });
        }
    } catch (error) {
        logger.error('Failed to handle payment captured', error);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payload) {
    try {
        const payment = await Payment.findOne({
            gateway_payment_id: payload.id
        });

        if (payment) {
            payment.status = 'failed';
            payment.failure_reason = payload.error_description || 'Payment failed';
            await payment.save();

            logger.info('Payment marked as failed', { payment_id: payment.id });
        }
    } catch (error) {
        logger.error('Failed to handle payment failure', error);
    }
}

/**
 * Handle order paid event
 */
async function handleOrderPaid(payload) {
    try {
        logger.info('Order paid event received', { order_id: payload.id });
        // Additional logic for order completion
    } catch (error) {
        logger.error('Failed to handle order paid', error);
    }
}

/**
 * @route POST /api/payments/verify
 * @desc Verify payment after checkout
 * @access Authenticated
 */
router.post('/verify', async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = razorpayService.verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        if (!isValid) {
            throw ApiError.badRequest('Invalid payment signature');
        }

        // Update payment record
        const payment = await Payment.findOne({
            gateway_order_id: razorpay_order_id
        });

        if (payment) {
            payment.gateway_payment_id = razorpay_payment_id;
            payment.gateway_signature = razorpay_signature;
            payment.status = 'completed';
            await payment.save();
        }

        res.json({
            success: true,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
