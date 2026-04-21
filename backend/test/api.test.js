/**
 * Integration tests for the Express API surface.
 *
 * The blockchain service is replaced with an in-memory stub so the tests
 * exercise routing, validation, auth middleware and response shape without
 * needing a live Sepolia node.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long-aaaa';
process.env.JWT_EXPIRY = '1h';
process.env.CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Demo-mode test wiring. We mint deterministic keys so the demo controller
// can resolve them via getDemoVoterAccounts/getDemoAdminAccount.
process.env.ENABLE_DEMO_LOGIN = 'true';
const { Wallet: _DemoWallet } = require('ethers');
const _demoAdminPk =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const _demoVoterPks = [
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
];
process.env.DEMO_ADMIN_KEY = _demoAdminPk;
process.env.DEMO_VOTER_KEYS = _demoVoterPks.join(',');
const DEMO_ADMIN_ADDRESS = new _DemoWallet(_demoAdminPk).address;
const DEMO_VOTER_ADDRESSES = _demoVoterPks.map((k) => new _DemoWallet(k).address);

const path = require('path');
const Module = require('module');
const { ethers } = require('ethers');
const { expect } = require('chai');

// ── Stub the blockchain service before requiring the app ──
const adminWallet = ethers.Wallet.createRandom();
const voterWallet = ethers.Wallet.createRandom();
const strangerWallet = ethers.Wallet.createRandom();

const stubState = {
  candidates: [],
  voters: new Map(),
  status: {
    isStarted: false,
    isEnded: false,
    totalVotes: 0,
    registeredVoterCount: 0,
    candidateCount: 0,
  },
};

const blockchainStub = {
  async getElectionStatus() {
    return { ...stubState.status };
  },
  async startElection() {
    stubState.status.isStarted = true;
    return { transactionHash: '0xstartedhash' };
  },
  async endElection() {
    stubState.status.isEnded = true;
    return { transactionHash: '0xendedhash', winner: stubState.candidates[0] || null };
  },
  async getResults() {
    return [...stubState.candidates];
  },
  async getWinner() {
    if (stubState.candidates.length === 0) {
      const err = new Error('No candidates'); err.statusCode = 400; err.code = 'NO_CANDIDATES';
      throw err;
    }
    return stubState.candidates[0];
  },
  async getAllCandidates() {
    return [...stubState.candidates];
  },
  async getCandidate(id) {
    const c = stubState.candidates[Number(id)];
    if (!c) { const e = new Error('Invalid'); e.statusCode = 404; e.code = 'INVALID_CANDIDATE'; throw e; }
    return c;
  },
  async addCandidate(name, manifesto) {
    const id = stubState.candidates.length;
    stubState.candidates.push({ id, name, manifesto, voteCount: 0 });
    stubState.status.candidateCount = stubState.candidates.length;
    return { transactionHash: '0xaddhash', candidateId: id };
  },
  async editCandidate(id, name, manifesto) {
    const c = stubState.candidates[Number(id)];
    if (!c) {
      const e = new Error('Invalid'); e.statusCode = 404; e.code = 'INVALID_CANDIDATE'; throw e;
    }
    c.name = name;
    c.manifesto = manifesto;
    return { transactionHash: '0xedithash' };
  },
  async removeCandidate(id) {
    const idx = Number(id);
    if (!stubState.candidates[idx]) {
      const e = new Error('Invalid'); e.statusCode = 404; e.code = 'INVALID_CANDIDATE'; throw e;
    }
    const last = stubState.candidates.pop();
    if (idx !== stubState.candidates.length) {
      stubState.candidates[idx] = { ...last, id: idx };
    }
    stubState.status.candidateCount = stubState.candidates.length;
    return { transactionHash: '0xremovehash' };
  },
  async castVoteAs(_pk, candidateId) {
    const c = stubState.candidates[Number(candidateId)];
    if (!c) {
      const e = new Error('Invalid'); e.statusCode = 404; e.code = 'INVALID_CANDIDATE'; throw e;
    }
    c.voteCount++;
    stubState.status.totalVotes++;
    return { transactionHash: '0xdemovotehash' };
  },
  async getVoterStatus(address) {
    const lower = address.toLowerCase();
    const v = stubState.voters.get(lower);
    return {
      address,
      isRegistered: !!v,
      hasVoted: v ? v.hasVoted : false,
      votedCandidateId: v && v.hasVoted ? v.votedCandidateId : null,
    };
  },
  async registerVoter(address) {
    const lower = address.toLowerCase();
    if (stubState.voters.has(lower)) {
      const e = new Error('Already'); e.statusCode = 400; e.code = 'ALREADY_REGISTERED'; throw e;
    }
    stubState.voters.set(lower, { hasVoted: false, votedCandidateId: null });
    stubState.status.registeredVoterCount = stubState.voters.size;
    return { transactionHash: '0xreghash' };
  },
  async registerVotersBatch(addresses) {
    let count = 0;
    for (const a of addresses) {
      const lower = a.toLowerCase();
      if (!stubState.voters.has(lower)) {
        stubState.voters.set(lower, { hasVoted: false, votedCandidateId: null });
        count++;
      }
    }
    stubState.status.registeredVoterCount = stubState.voters.size;
    return { transactionHash: '0xbatchhash', registeredCount: count };
  },
  async prepareVoteTransaction(candidateId) {
    return { to: process.env.CONTRACT_ADDRESS, data: `0xvote${candidateId}` };
  },
  async listVoters() {
    return Array.from(stubState.voters.entries()).map(([address, v]) => ({
      address,
      isRegistered: true,
      hasVoted: v.hasVoted,
      votedCandidateId: v.votedCandidateId,
      registeredAt: 1,
    }));
  },
  async isAdmin(address) {
    return (
      address.toLowerCase() === adminWallet.address.toLowerCase() ||
      address.toLowerCase() === DEMO_ADMIN_ADDRESS.toLowerCase()
    );
  },
};

// Hijack require so the app uses our stub
const blockchainServicePath = path.resolve(
  __dirname,
  '../src/services/blockchain.service.js'
);
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  const resolved = originalResolve.call(this, request, parent, ...rest);
  if (resolved === blockchainServicePath) {
    return path.resolve(__dirname, './blockchain.stub.js');
  }
  return resolved;
};

// Write the stub to disk so the resolver can load it as a real module
const fs = require('fs');
fs.writeFileSync(
  path.resolve(__dirname, './blockchain.stub.js'),
  `module.exports = global.__BLOCKCHAIN_STUB__;\n`
);
global.__BLOCKCHAIN_STUB__ = blockchainStub;

const request = require('supertest');
const app = require('../src/app');

async function authTokenFor(wallet) {
  const nonceRes = await request(app)
    .post('/api/v1/auth/nonce')
    .send({ address: wallet.address });
  const message = nonceRes.body.data.message;
  const signature = await wallet.signMessage(message);
  const verifyRes = await request(app)
    .post('/api/v1/auth/verify')
    .send({ address: wallet.address, signature });
  return verifyRes.body.data ? verifyRes.body.data.token : null;
}

describe('API integration', function () {
  this.timeout(10000);

  beforeEach(() => {
    stubState.candidates.length = 0;
    stubState.voters.clear();
    stubState.status = {
      isStarted: false,
      isEnded: false,
      totalVotes: 0,
      registeredVoterCount: 0,
      candidateCount: 0,
    };
    // Pre-register demo voters so demo-mode tests don't have to.
    for (const addr of DEMO_VOTER_ADDRESSES) {
      stubState.voters.set(addr.toLowerCase(), {
        hasVoted: false,
        votedCandidateId: null,
      });
    }
    stubState.status.registeredVoterCount = stubState.voters.size;
  });

  describe('GET /api/v1/election/status', () => {
    it('returns election status with the standard envelope', async () => {
      const res = await request(app).get('/api/v1/election/status');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.include.keys('isStarted', 'isEnded');
    });
  });

  describe('GET /api/v1/candidates', () => {
    it('returns an empty list initially', async () => {
      const res = await request(app).get('/api/v1/candidates');
      expect(res.status).to.equal(200);
      expect(res.body.data.candidates).to.deep.equal([]);
    });
  });

  describe('Auth flow', () => {
    it('rejects verify with no prior nonce', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify')
        .send({ address: voterWallet.address, signature: '0xdeadbeef' });
      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('rejects unregistered non-admin address', async () => {
      const token = await authTokenFor(strangerWallet);
      expect(token).to.equal(null);
    });

    it('issues a JWT for the admin wallet', async () => {
      const token = await authTokenFor(adminWallet);
      expect(token).to.be.a('string');
    });

    it('issues a JWT for a registered voter', async () => {
      stubState.voters.set(voterWallet.address.toLowerCase(), {
        hasVoted: false,
        votedCandidateId: null,
      });
      const token = await authTokenFor(voterWallet);
      expect(token).to.be.a('string');
    });
  });

  describe('Admin endpoints', () => {
    it('rejects addCandidate without auth', async () => {
      const res = await request(app)
        .post('/api/v1/candidates')
        .send({ name: 'Alice', manifesto: 'Hello' });
      expect(res.status).to.equal(401);
    });

    it('rejects addCandidate with voter token', async () => {
      stubState.voters.set(voterWallet.address.toLowerCase(), {
        hasVoted: false,
        votedCandidateId: null,
      });
      const token = await authTokenFor(voterWallet);
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice', manifesto: 'Hello' });
      expect(res.status).to.equal(403);
      expect(res.body.error.code).to.equal('NOT_ADMIN');
    });

    it('accepts addCandidate from admin', async () => {
      const token = await authTokenFor(adminWallet);
      const res = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice', manifesto: 'Hello world' });
      expect(res.status).to.equal(201);
      expect(res.body.data.candidateId).to.equal(0);
    });
  });

  describe('Validation', () => {
    it('rejects bad address on nonce', async () => {
      const res = await request(app)
        .post('/api/v1/auth/nonce')
        .send({ address: 'not-an-address' });
      expect(res.status).to.equal(400);
      expect(res.body.error.code).to.equal('VALIDATION_ERROR');
    });

    it('rejects malformed JSON', async () => {
      const res = await request(app)
        .post('/api/v1/auth/nonce')
        .set('Content-Type', 'application/json')
        .send('{not valid');
      expect(res.status).to.equal(400);
    });
  });

  describe('Not found handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/does-not-exist');
      expect(res.status).to.equal(404);
      expect(res.body.error.code).to.equal('NOT_FOUND');
    });
  });

  describe('Swagger docs', () => {
    it('serves /api-docs.json', async () => {
      const res = await request(app).get('/api-docs.json');
      expect(res.status).to.equal(200);
      expect(res.body.openapi).to.match(/^3\./);
    });

    it('serves /api-docs.yaml', async () => {
      const res = await request(app).get('/api-docs.yaml');
      expect(res.status).to.equal(200);
      expect(res.text).to.include('openapi:');
    });
  });

  describe('Demo login', () => {
    it('lists demo accounts when enabled', async () => {
      const res = await request(app).get('/api/v1/auth/demo-accounts');
      expect(res.status).to.equal(200);
      expect(res.body.data.admin.address).to.equal(DEMO_ADMIN_ADDRESS);
      expect(res.body.data.voters).to.have.length(DEMO_VOTER_ADDRESSES.length);
    });

    it('issues a JWT for the demo admin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'admin' });
      expect(res.status).to.equal(200);
      expect(res.body.data.role).to.equal('admin');
      expect(res.body.data.isDemo).to.equal(true);
    });

    it('issues a JWT for a demo voter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'voter', index: 1 });
      expect(res.status).to.equal(200);
      expect(res.body.data.address).to.equal(DEMO_VOTER_ADDRESSES[1]);
    });

    it('rejects invalid role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'hacker' });
      expect(res.status).to.equal(400);
    });

    it('demo voter can cast a vote without a wallet signature', async () => {
      // Seed a candidate first so vote() has a valid target.
      const adminToken = await authTokenFor(adminWallet);
      await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Alice', manifesto: 'Hello' });

      const demoLogin = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'voter', index: 0 });
      const token = demoLogin.body.data.token;

      const voteRes = await request(app)
        .post('/api/v1/voters/vote')
        .set('Authorization', `Bearer ${token}`)
        .send({ candidateId: 0 });

      expect(voteRes.status).to.equal(200);
      expect(voteRes.body.data.transactionHash).to.equal('0xdemovotehash');
    });
  });

  describe('Candidate CRUD (admin)', () => {
    it('admin can edit a candidate', async () => {
      const token = await authTokenFor(adminWallet);
      await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original', manifesto: 'Original' });

      const res = await request(app)
        .patch('/api/v1/candidates/0')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated', manifesto: 'Updated manifesto' });
      expect(res.status).to.equal(200);

      const fresh = await request(app).get('/api/v1/candidates/0');
      expect(fresh.body.data.candidate.name).to.equal('Updated');
    });

    it('admin can remove a candidate', async () => {
      const token = await authTokenFor(adminWallet);
      await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Doomed', manifesto: 'Remove me' });

      const res = await request(app)
        .delete('/api/v1/candidates/0')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).to.equal(200);

      const list = await request(app).get('/api/v1/candidates');
      expect(list.body.data.candidates).to.have.length(0);
    });

    it('rejects edit from non-admin', async () => {
      const token = await authTokenFor(adminWallet);
      await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', manifesto: 'Y' });

      const voterRes = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'voter', index: 0 });
      const voterToken = voterRes.body.data.token;

      const res = await request(app)
        .patch('/api/v1/candidates/0')
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ name: 'Hijacked', manifesto: '!' });
      expect(res.status).to.equal(403);
    });

    it('rejects delete from non-admin', async () => {
      const token = await authTokenFor(adminWallet);
      await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', manifesto: 'Y' });

      const voterRes = await request(app)
        .post('/api/v1/auth/demo')
        .send({ role: 'voter', index: 0 });
      const voterToken = voterRes.body.data.token;

      const res = await request(app)
        .delete('/api/v1/candidates/0')
        .set('Authorization', `Bearer ${voterToken}`);
      expect(res.status).to.equal(403);
    });
  });
});
