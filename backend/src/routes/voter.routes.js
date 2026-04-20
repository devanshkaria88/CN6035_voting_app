const { Router } = require('express');
const voterController = require('../controllers/voter.controller');
const {
  authenticate,
  requireAdmin,
  requireVoter,
} = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  registerVoterSchema,
  batchRegisterSchema,
  voteSchema,
  voterAddressParam,
} = require('../validators/voter.validator');

const router = Router();

/**
 * @openapi
 * /api/v1/voters/{address}:
 *   get:
 *     tags: [Voters]
 *     summary: Get voter status
 *     description: Returns registration status, voting status, and selected candidate for a given wallet address.
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum wallet address
 *     responses:
 *       200:
 *         description: Voter status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Voter'
 *             example:
 *               success: true
 *               data:
 *                 address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *                 isRegistered: true
 *                 hasVoted: false
 *                 votedCandidateId: null
 *               message: Voter status retrieved
 *       400:
 *         description: Invalid address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  '/:address',
  validate(voterAddressParam, 'params'),
  voterController.getStatus
);

/**
 * @openapi
 * /api/v1/voters/register:
 *   post:
 *     tags: [Voters]
 *     summary: Register a single voter
 *     description: Registers a wallet address as an eligible voter. Only the admin can register voters, and only before the election starts.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterVoterRequest'
 *           example:
 *             address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *     responses:
 *       201:
 *         description: Voter registered
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         transactionHash:
 *                           type: string
 *             example:
 *               success: true
 *               data:
 *                 transactionHash: "0xabc123..."
 *               message: Voter registered successfully
 *       400:
 *         description: Invalid address or voter already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/register',
  authenticate,
  requireAdmin,
  validate(registerVoterSchema),
  voterController.register
);

/**
 * @openapi
 * /api/v1/voters/register-batch:
 *   post:
 *     tags: [Voters]
 *     summary: Register multiple voters
 *     description: Registers multiple wallet addresses as eligible voters in a single transaction. Skips addresses that are already registered.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchRegisterRequest'
 *           example:
 *             addresses:
 *               - "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
 *               - "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
 *     responses:
 *       201:
 *         description: Voters registered
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         transactionHash:
 *                           type: string
 *                         registeredCount:
 *                           type: integer
 *             example:
 *               success: true
 *               data:
 *                 transactionHash: "0xdef456..."
 *                 registeredCount: 2
 *               message: Voters registered successfully
 *       400:
 *         description: Invalid addresses or empty array
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/register-batch',
  authenticate,
  requireAdmin,
  validate(batchRegisterSchema),
  voterController.registerBatch
);

/**
 * @openapi
 * /api/v1/voters/vote:
 *   post:
 *     tags: [Voters]
 *     summary: Cast a vote
 *     description: Submits a vote for the specified candidate. The voter must be authenticated, registered, and must not have already voted. The election must be active.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteRequest'
 *           example:
 *             candidateId: 1
 *     responses:
 *       200:
 *         description: Vote transaction prepared for wallet submission
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         to:
 *                           type: string
 *                           description: Contract address to send the transaction to
 *                         data:
 *                           type: string
 *                           description: Encoded transaction data to sign with wallet
 *             example:
 *               success: true
 *               data:
 *                 to: "0x1234567890abcdef1234567890abcdef12345678"
 *                 data: "0x0121b93f0000000000000000000000000000000000000000000000000000000000000001"
 *               message: Vote transaction prepared. Submit via wallet.
 *       400:
 *         description: Invalid candidate, already voted, or election not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not a registered voter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/vote',
  authenticate,
  requireVoter,
  validate(voteSchema),
  voterController.vote
);

module.exports = router;
