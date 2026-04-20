const blockchainService = require('../services/blockchain.service');
const { sendSuccess } = require('../utils/response');

const electionController = {
  async getStatus(_req, res, next) {
    try {
      const status = await blockchainService.getElectionStatus();
      sendSuccess(res, status, 'Election status retrieved');
    } catch (error) {
      next(error);
    }
  },

  async start(_req, res, next) {
    try {
      const result = await blockchainService.startElection();
      sendSuccess(res, result, 'Election started successfully');
    } catch (error) {
      next(error);
    }
  },

  async end(_req, res, next) {
    try {
      const result = await blockchainService.endElection();
      sendSuccess(res, result, 'Election ended successfully');
    } catch (error) {
      next(error);
    }
  },

  async getResults(_req, res, next) {
    try {
      const results = await blockchainService.getResults();
      sendSuccess(res, { candidates: results }, 'Election results retrieved');
    } catch (error) {
      next(error);
    }
  },

  async getWinner(_req, res, next) {
    try {
      const winner = await blockchainService.getWinner();
      sendSuccess(res, { winner }, 'Winner retrieved');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = electionController;
