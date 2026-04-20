const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation.middleware');
const { nonceSchema, verifySchema } = require('../validators/auth.validator');

const router = Router();

/**
 * @openapi
 * /api/v1/auth/nonce:
 *   post:
 *     tags: [Auth]
 *     summary: Generate authentication nonce
 *     description: Generates a unique nonce for the given wallet address. The user must sign the returned message with their wallet to authenticate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthNonceRequest'
 *           example:
 *             address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *     responses:
 *       200:
 *         description: Nonce generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthNonceResponse'
 *             example:
 *               success: true
 *               data:
 *                 nonce: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 message: "Sign this message to authenticate with ClassRep Vote:\n\nNonce: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               message: Nonce generated
 *       400:
 *         description: Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/nonce', validate(nonceSchema), authController.getNonce);

/**
 * @openapi
 * /api/v1/auth/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify wallet signature
 *     description: Verifies the signed nonce message and returns a JWT token. The token includes the wallet address and role (admin or voter).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyRequest'
 *           example:
 *             address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *             signature: "0x..."
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthVerifyResponse'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIs..."
 *                 address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *                 role: "voter"
 *               message: Authentication successful
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/verify', validate(verifySchema), authController.verify);

module.exports = router;
