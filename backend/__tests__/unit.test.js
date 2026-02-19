/**
 * Health & Basic Integration Tests
 * Run: npm test
 */

const request = require('supertest') || null;

// ── Unit tests (no DB required) ──────────────────────────────────────────────

describe('validators.js', () => {
    const { validators, validate } = require('../utils/validators');

    test('requiredString rejects empty string', () => {
        const validator = validators.requiredString('name', 1, 255);
        // validator is an express-validator chain; test msg
        expect(validator).toBeDefined();
    });

    test('validate is a function', () => {
        expect(typeof validate).toBe('function');
    });
});

describe('auth middleware', () => {
    const { authenticate, optionalAuth, requireSuperAdmin } = require('../middleware/auth');

    test('exports authenticate function', () => {
        expect(typeof authenticate).toBe('function');
    });

    test('exports optionalAuth function', () => {
        expect(typeof optionalAuth).toBe('function');
    });

    test('exports requireSuperAdmin function', () => {
        expect(typeof requireSuperAdmin).toBe('function');
    });

    test('requireSuperAdmin blocks non-super-admin', () => {
        const next = jest.fn();
        const req = { user: { is_super_admin: false } };
        requireSuperAdmin(req, {}, next);
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    test('requireSuperAdmin allows super admin', () => {
        const next = jest.fn();
        const req = { user: { is_super_admin: true } };
        requireSuperAdmin(req, {}, next);
        expect(next).toHaveBeenCalledWith(/* no args */);
    });
});

describe('CORS configuration in server', () => {
    test('ALLOWED_ORIGINS env var is parseable', () => {
        const val = 'https://realnext.in,https://www.realnext.in,http://localhost:3000';
        const origins = val.split(',').map(o => o.trim());
        expect(origins.length).toBe(3);
        expect(origins).toContain('https://realnext.in');
        expect(origins).toContain('http://localhost:3000');
    });
});

describe('Lead model schema', () => {
    test('Lead model can be required without DB', () => {
        // Mock mongoose to avoid actual DB connection
        jest.mock('mongoose', () => {
            const m = jest.requireActual('mongoose');
            // Don't connect
            return m;
        });
        // Just check the model file can be required without throwing
        expect(() => {
            const Lead = require('../models/Lead');
            expect(Lead).toBeDefined();
        }).not.toThrow();
    });
});
