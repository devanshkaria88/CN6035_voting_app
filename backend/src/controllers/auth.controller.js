const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

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
};

module.exports = authController;
