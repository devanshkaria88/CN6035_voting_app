const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { AuthenticationError } = require('../utils/errors');
const blockchainService = require('./blockchain.service');

const nonceStore = new Map();

const NONCE_EXPIRY_MS = 5 * 60 * 1000;

class AuthService {
  generateNonce(address) {
    const nonce = uuidv4();
    const message = `Sign this message to authenticate with ClassRep Vote:\n\nNonce: ${nonce}`;

    nonceStore.set(address.toLowerCase(), {
      nonce,
      message,
      createdAt: Date.now(),
    });

    return { nonce, message };
  }

  async verifySignature(address, signature) {
    const normalised = address.toLowerCase();
    const stored = nonceStore.get(normalised);

    if (!stored) {
      throw new AuthenticationError('No authentication nonce found for this address. Request a nonce first.');
    }

    if (Date.now() - stored.createdAt > NONCE_EXPIRY_MS) {
      nonceStore.delete(normalised);
      throw new AuthenticationError('Authentication nonce has expired. Request a new nonce.');
    }

    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(stored.message, signature);
    } catch {
      throw new AuthenticationError('Invalid signature format');
    }

    if (recoveredAddress.toLowerCase() !== normalised) {
      throw new AuthenticationError('Signature does not match the provided address');
    }

    nonceStore.delete(normalised);

    const isAdminAddress = await blockchainService.isAdmin(address);
    const role = isAdminAddress ? 'admin' : 'voter';

    const token = jwt.sign(
      { address: ethers.getAddress(address), role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    return { token, address: ethers.getAddress(address), role };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
