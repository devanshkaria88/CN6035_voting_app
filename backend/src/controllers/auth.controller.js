const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const {
  getDemoAdminAccount,
  getDemoVoterAccounts,
} = require('../config/blockchain');

const authController = {
  async getNonce(req, res, next) {
    try {
      const { address } = req.body;
      const result = authService.generateNonce(address);
      sendSuccess(res, result, 'Nonce generated');
    } catch (error) {
      next(error);
    }
  },

  async verify(req, res, next) {
    try {
      const { address, signature } = req.body;
      const result = await authService.verifySignature(address, signature);
      sendSuccess(res, result, 'Authentication successful');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lists the seeded demo accounts available for the in-app
   * "Sign in as Demo" picker. Returns 404 when demo login is disabled so
   * production deployments do not advertise the affordance.
   */
  async listDemoAccounts(_req, res, next) {
    try {
      if (!authService.isDemoLoginEnabled()) {
        throw new NotFoundError('Demo login is disabled');
      }
      const admin = getDemoAdminAccount();
      const voters = getDemoVoterAccounts();
      sendSuccess(
        res,
        {
          admin: admin ? { address: admin.address } : null,
          voters: voters.map((v, i) => ({ index: i, address: v.address })),
        },
        'Demo accounts retrieved'
      );
    } catch (error) {
      next(error);
    }
  },

  async demoLogin(req, res, next) {
    try {
      if (!authService.isDemoLoginEnabled()) {
        throw new NotFoundError('Demo login is disabled');
      }
      const { role, index } = req.body;
      const result = await authService.loginAsDemo(role, Number(index) || 0);
      sendSuccess(res, result, 'Demo authentication successful');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
