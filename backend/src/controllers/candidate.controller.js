const blockchainService = require('../services/blockchain.service');
const { sendSuccess } = require('../utils/response');

const candidateController = {
  async getAll(_req, res, next) {
    try {
      const candidates = await blockchainService.getAllCandidates();
      sendSuccess(res, { candidates }, 'Candidates retrieved');
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const candidate = await blockchainService.getCandidate(
        Number(req.params.id)
      );
      sendSuccess(res, { candidate }, 'Candidate retrieved');
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, manifesto } = req.body;
      const result = await blockchainService.addCandidate(name, manifesto);
      sendSuccess(res, result, 'Candidate added successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { name, manifesto } = req.body;
      const result = await blockchainService.editCandidate(id, name, manifesto);
      sendSuccess(res, result, 'Candidate updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const id = Number(req.params.id);
      const result = await blockchainService.removeCandidate(id);
      sendSuccess(res, result, 'Candidate removed successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = candidateController;
