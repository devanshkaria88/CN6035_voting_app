const blockchainService = require('../services/blockchain.service');
const { sendSuccess } = require('../utils/response');

const voterController = {
  async getStatus(req, res, next) {
    try {
      const voter = await blockchainService.getVoterStatus(req.params.address);
      sendSuccess(res, voter, 'Voter status retrieved');
    } catch (error) {
      next(error);
    }
  },

  async register(req, res, next) {
    try {
      const result = await blockchainService.registerVoter(req.body.address);
      sendSuccess(res, result, 'Voter registered successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async registerBatch(req, res, next) {
    try {
      const result = await blockchainService.registerVotersBatch(
        req.body.addresses
      );
      sendSuccess(res, result, 'Voters registered successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  async vote(req, res, next) {
    try {
      const { candidateId } = req.body;
      const txData = await blockchainService.prepareVoteTransaction(candidateId);
      sendSuccess(res, txData, 'Vote transaction prepared. Submit via wallet.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = voterController;
