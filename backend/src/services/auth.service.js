const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { AuthenticationError } = require('../utils/errors');
const blockchainService = require('./blockchain.service');
const {
  getDemoAdminAccount,
  getDemoVoterAccounts,
} = require('../config/blockchain');

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

    const checksumAddress = ethers.getAddress(address);
    const isAdminAddress = await blockchainService.isAdmin(checksumAddress);

    let role;
    let isRegisteredVoter = false;

    if (isAdminAddress) {
      role = 'admin';
    } else {
      const voterStatus = await blockchainService.getVoterStatus(checksumAddress);
      isRegisteredVoter = voterStatus.isRegistered;
      if (!isRegisteredVoter) {
        throw new AuthenticationError(
          'Address is neither admin nor a registered voter. Authentication denied.'
        );
      }
      role = 'voter';
    }

    const token = jwt.sign(
      { address: checksumAddress, role, isRegisteredVoter },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    return { token, address: checksumAddress, role };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Returns whether the demo login flow is currently enabled. The flag is
   * driven by ENABLE_DEMO_LOGIN so production deployments can opt out.
   */
  isDemoLoginEnabled() {
    return String(process.env.ENABLE_DEMO_LOGIN).toLowerCase() === 'true';
  }

  /**
   * Issues a JWT for a seeded demo wallet without any signature challenge.
   * Used by the in-app "Sign in as Demo" affordance. The endpoint is
   * disabled unless ENABLE_DEMO_LOGIN=true.
   *
   * @param {'admin'|'voter'} role
   * @param {number} [index] Voter index when role === 'voter' (defaults to 0).
   * @returns {{ token: string, address: string, role: string, isDemo: true }}
   */
  async loginAsDemo(role, index = 0) {
    if (!this.isDemoLoginEnabled()) {
      throw new AuthenticationError('Demo login is disabled');
    }

    if (role !== 'admin' && role !== 'voter') {
      throw new AuthenticationError(
        "Invalid demo role. Expected 'admin' or 'voter'."
      );
    }

    let account;
    let keyIndex;

    if (role === 'admin') {
      account = getDemoAdminAccount();
      if (!account) {
        throw new AuthenticationError('Demo admin account not configured');
      }
      keyIndex = -1;
    } else {
      const voters = getDemoVoterAccounts();
      if (voters.length === 0) {
        throw new AuthenticationError(
          'No demo voter accounts configured (set DEMO_VOTER_KEYS)'
        );
      }
      keyIndex = Math.max(0, Math.min(index, voters.length - 1));
      account = voters[keyIndex];
    }

    const checksumAddress = ethers.getAddress(account.address);

    let isRegisteredVoter = false;
    if (role === 'voter') {
      const status = await blockchainService.getVoterStatus(checksumAddress);
      isRegisteredVoter = status.isRegistered;
      if (!isRegisteredVoter) {
        throw new AuthenticationError(
          'Demo voter is not yet registered on-chain. Run the seed script first.'
        );
      }
    } else {
      const onChainAdmin = await blockchainService.isAdmin(checksumAddress);
      if (!onChainAdmin) {
        throw new AuthenticationError(
          'Demo admin key does not match the deployed contract admin.'
        );
      }
    }

    const token = jwt.sign(
      {
        address: checksumAddress,
        role,
        isRegisteredVoter,
        isDemo: true,
        keyIndex,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    return { token, address: checksumAddress, role, isDemo: true };
  }
}

module.exports = new AuthService();
