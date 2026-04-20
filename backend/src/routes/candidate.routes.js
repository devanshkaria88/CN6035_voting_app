const { Router } = require('express');
const candidateController = require('../controllers/candidate.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  addCandidateSchema,
  candidateIdParam,
} = require('../validators/candidate.validator');

const router = Router();

/**
 * @openapi
 * /api/v1/candidates:
 *   get:
 *     tags: [Candidates]
 *     summary: List all candidates
 *     description: Returns an array of all registered candidates with their details and current vote counts.
 *     responses:
 *       200:
 *         description: Candidates retrieved
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
 *                     manifesto: "Better campus facilities"
 *                     voteCount: 0
 *                   - id: 1
 *                     name: "Bob Smith"
 *                     manifesto: "Longer breaks"
 *                     voteCount: 0
 *               message: Candidates retrieved
 *       500:
 *         description: Blockchain error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', candidateController.getAll);

/**
 * @openapi
 * /api/v1/candidates/{id}:
 *   get:
 *     tags: [Candidates]
 *     summary: Get candidate by ID
 *     description: Returns a single candidate's details by their numeric ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: The candidate ID
 *     responses:
 *       200:
 *         description: Candidate retrieved
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
 *                         candidate:
 *                           $ref: '#/components/schemas/Candidate'
 *             example:
 *               success: true
 *               data:
 *                 candidate:
 *                   id: 0
 *                   name: "Alice Johnson"
 *                   manifesto: "Better campus facilities"
 *                   voteCount: 12
 *               message: Candidate retrieved
 *       400:
 *         description: Invalid candidate ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Candidate not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', validate(candidateIdParam, 'params'), candidateController.getById);

/**
 * @openapi
 * /api/v1/candidates:
 *   post:
 *     tags: [Candidates]
 *     summary: Add a new candidate
 *     description: Registers a new candidate for the election. Only the admin can add candidates, and only before the election starts.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCandidateRequest'
 *           example:
 *             name: "Alice Johnson"
 *             manifesto: "I will improve campus facilities and student welfare."
 *     responses:
 *       201:
 *         description: Candidate added
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
 *                         candidateId:
 *                           type: integer
 *             example:
 *               success: true
 *               data:
 *                 transactionHash: "0xabc123..."
 *                 candidateId: 0
 *               message: Candidate added successfully
 *       400:
 *         description: Validation error or election already started
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
  '/',
  authenticate,
  requireAdmin,
  validate(addCandidateSchema),
  candidateController.create
);

module.exports = router;
