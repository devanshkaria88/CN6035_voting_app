const blockchainService = require('../services/blockchain.service');
const { sendSuccess } = require('../utils/response');
const { getDemoVoterAccounts } = require('../config/blockchain');
const { AuthenticationError } = require('../utils/errors');

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

      // Demo voters cannot sign transactions client-side (no MetaMask), so
      // the backend signs and broadcasts on their behalf using the seeded
      // private key associated with their JWT.
      if (req.user && req.user.isDemo && req.user.role === 'voter') {
        const voters = getDemoVoterAccounts();
        const account = voters[req.user.keyIndex];
        if (!account) {
          throw new AuthenticationError(
            'Demo voter session is invalid: no matching key on the server.'
          );
        }
        const result = await blockchainService.castVoteAs(
          account.privateKey,
          candidateId
        );
        return sendSuccess(res, result, 'Vote cast successfully');
      }

      const txData = await blockchainService.prepareVoteTransaction(candidateId);
      sendSuccess(res, txData, 'Vote transaction prepared. Submit via wallet.');
    } catch (error) {
      next(error);
    }
  },

  async list(_req, res, next) {
    try {
      const voters = await blockchainService.listVoters();
      sendSuccess(res, { voters, total: voters.length }, 'Voters retrieved');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = voterController;
