const { Router } = require('express');
const { sendSuccess } = require('../utils/response');
const { getABI } = require('../config/blockchain');
const electionRoutes = require('./election.routes');
const candidateRoutes = require('./candidate.routes');
const voterRoutes = require('./voter.routes');
const authRoutes = require('./auth.routes');

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Service health check
 *     description: Returns the health status of the API service.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 status: "ok"
 *                 timestamp: "2026-03-18T12:00:00.000Z"
 *               message: Service is healthy
 */
router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'Service is healthy');
});

/**
 * @openapi
 * /api/v1/contract/address:
 *   get:
 *     tags: [Contract]
 *     summary: Get deployed contract address
 *     description: Returns the Ethereum address of the deployed ClassRepVoting smart contract.
 *     responses:
 *       200:
 *         description: Contract address returned
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 address: "0x1234567890abcdef1234567890abcdef12345678"
 *               message: Contract address retrieved
 */
router.get('/contract/address', (_req, res) => {
  sendSuccess(
    res,
    { address: process.env.CONTRACT_ADDRESS || 'Not configured' },
    'Contract address retrieved'
  );
});

/**
 * @openapi
 * /api/v1/contract/abi:
 *   get:
 *     tags: [Contract]
 *     summary: Get contract ABI
 *     description: Returns the ABI (Application Binary Interface) JSON of the ClassRepVoting smart contract. Useful for direct contract interaction from the frontend.
 *     responses:
 *       200:
 *         description: Contract ABI returned
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
 *                         abi:
 *                           type: array
 *                           items:
 *                             type: object
 *       500:
 *         description: ABI not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/contract/abi', (_req, res, next) => {
  try {
    const abi = getABI();
    sendSuccess(res, { abi }, 'Contract ABI retrieved');
  } catch (error) {
    next(error);
  }
});

router.use('/election', electionRoutes);
router.use('/candidates', candidateRoutes);
router.use('/voters', voterRoutes);
router.use('/auth', authRoutes);

module.exports = router;
