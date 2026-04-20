const { Router } = require('express');
const electionController = require('../controllers/election.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

/**
 * @openapi
 * /api/v1/election/status:
 *   get:
 *     tags: [Election]
 *     summary: Get election status
 *     description: Returns the current election state including whether voting is active, total candidates, registered voters, and votes cast.
 *     responses:
 *       200:
 *         description: Election status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ElectionStatus'
 *             example:
 *               success: true
 *               data:
 *                 isStarted: false
 *                 isEnded: false
 *                 candidateCount: 3
 *                 registeredVoterCount: 50
 *                 totalVotes: 0
 *               message: Election status retrieved
 *       500:
 *         description: Blockchain error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/status', electionController.getStatus);

/**
 * @openapi
 * /api/v1/election/start:
 *   post:
 *     tags: [Election]
 *     summary: Start the election
 *     description: Activates the voting period. Only the admin can start the election. Requires at least one candidate to be registered.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Election started successfully
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
 *               message: Election started successfully
 *       400:
 *         description: Election already started or no candidates
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
router.post('/start', authenticate, requireAdmin, electionController.start);

/**
 * @openapi
 * /api/v1/election/end:
 *   post:
 *     tags: [Election]
 *     summary: End the election
 *     description: Concludes the election and determines the winner. Only the admin can end the election.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Election ended successfully
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
 *                         winner:
 *                           $ref: '#/components/schemas/Candidate'
 *             example:
 *               success: true
 *               data:
 *                 transactionHash: "0xdef456..."
 *                 winner:
 *                   id: 1
 *                   name: "Alice Johnson"
 *                   voteCount: 25
 *               message: Election ended successfully
 *       400:
 *         description: Election not started or already ended
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
router.post('/end', authenticate, requireAdmin, electionController.end);

/**
 * @openapi
 * /api/v1/election/results:
 *   get:
 *     tags: [Election]
 *     summary: Get election results
 *     description: Returns all candidates with their current vote counts.
 *     responses:
 *       200:
 *         description: Results retrieved
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
 *                         candidates:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Candidate'
 *             example:
 *               success: true
 *               data:
 *                 candidates:
 *                   - id: 0
 *                     name: "Alice Johnson"
 *                     manifesto: "Better facilities"
 *                     voteCount: 25
 *                   - id: 1
 *                     name: "Bob Smith"
 *                     manifesto: "Longer breaks"
 *                     voteCount: 18
 *               message: Election results retrieved
 *       500:
 *         description: Blockchain error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/results', electionController.getResults);

/**
 * @openapi
 * /api/v1/election/winner:
 *   get:
 *     tags: [Election]
 *     summary: Get the current winner
 *     description: Returns the candidate with the highest vote count. If tied, the candidate with the lower ID is returned.
 *     responses:
 *       200:
 *         description: Winner retrieved
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
 *                         winner:
 *                           $ref: '#/components/schemas/Candidate'
 *             example:
 *               success: true
 *               data:
 *                 winner:
 *                   id: 0
 *                   name: "Alice Johnson"
 *                   manifesto: "Better facilities"
 *                   voteCount: 25
 *               message: Winner retrieved
 *       400:
 *         description: No candidates registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/winner', electionController.getWinner);

module.exports = router;
