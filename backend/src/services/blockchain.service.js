const {
  getContract,
  getReadOnlyContract,
  getContractAsSigner,
} = require('../config/blockchain');
const { parseBlockchainError } = require('../utils/errors');

class BlockchainService {
  _readContract() {
    return getReadOnlyContract();
  }

  _writeContract() {
    return getContract();
  }

  async _executeTx(txPromise) {
    try {
      const tx = await txPromise;
      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  /**
   * Estimate gas for a contract method with a 20% safety margin and
   * statically simulate the call so reverts surface before broadcasting.
   * Returns a callable factory that executes the tx with an explicit gas limit.
   */
  async _safeSend(method, args = []) {
    const contract = this._writeContract();
    const fn = contract[method];
    if (typeof fn !== 'function') {
      throw new Error(`Unknown contract method: ${method}`);
    }

    try {
      await fn.staticCall(...args);
      const estimated = await fn.estimateGas(...args);
      const gasLimit = (estimated * 120n) / 100n;
      return await this._executeTx(fn(...args, { gasLimit }));
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  // ── Election ──────────────────────────────

  async getElectionStatus() {
    try {
      const contract = this._readContract();
      const [started, ended, votes, voterCount, candidateCount] =
        await contract.getElectionStatus();

      return {
        isStarted: started,
        isEnded: ended,
        totalVotes: Number(votes),
        registeredVoterCount: Number(voterCount),
        candidateCount: Number(candidateCount),
      };
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  async startElection() {
    const { receipt } = await this._safeSend('startElection');
    return { transactionHash: receipt.hash };
  }

  async endElection() {
    const contract = this._writeContract();
    const { receipt } = await this._safeSend('endElection');

    const electionEndedEvent = receipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'ElectionEnded';
      } catch {
        return false;
      }
    });

    let winner = null;
    if (electionEndedEvent) {
      const parsed = contract.interface.parseLog(electionEndedEvent);
      winner = {
        id: Number(parsed.args[0]),
        name: parsed.args[1],
        voteCount: Number(parsed.args[2]),
      };
    }

    return { transactionHash: receipt.hash, winner };
  }

  async getResults() {
    try {
      const contract = this._readContract();
      const rawCandidates = await contract.getResults();
      return rawCandidates.map(this._formatCandidate);
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  async getWinner() {
    try {
      const contract = this._readContract();
      const raw = await contract.getWinner();
      return this._formatCandidate(raw);
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  // ── Candidates ────────────────────────────

  async getAllCandidates() {
    try {
      const contract = this._readContract();
      const rawCandidates = await contract.getAllCandidates();
      return rawCandidates.map(this._formatCandidate);
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  async getCandidate(id) {
    try {
      const contract = this._readContract();
      const raw = await contract.getCandidate(id);
      return this._formatCandidate(raw);
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  async addCandidate(name, manifesto) {
    const contract = this._writeContract();
    const { receipt } = await this._safeSend('addCandidate', [name, manifesto]);

    const addedEvent = receipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'CandidateAdded';
      } catch {
        return false;
      }
    });

    let candidateId = null;
    if (addedEvent) {
      const parsed = contract.interface.parseLog(addedEvent);
      candidateId = Number(parsed.args[0]);
    }

    return { transactionHash: receipt.hash, candidateId };
  }

  async editCandidate(id, name, manifesto) {
    const { receipt } = await this._safeSend('editCandidate', [
      id,
      name,
      manifesto,
    ]);
    return { transactionHash: receipt.hash };
  }

  async removeCandidate(id) {
    const { receipt } = await this._safeSend('removeCandidate', [id]);
    return { transactionHash: receipt.hash };
  }

  // ── Voters ────────────────────────────────

  async getVoterStatus(address) {
    try {
      const contract = this._readContract();
      const raw = await contract.getVoterStatus(address);
      return {
        address,
        isRegistered: raw.isRegistered,
        hasVoted: raw.hasVoted,
        votedCandidateId: raw.hasVoted ? Number(raw.votedCandidateId) : null,
      };
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  async registerVoter(address) {
    const { receipt } = await this._safeSend('registerVoter', [address]);
    return { transactionHash: receipt.hash };
  }

  async registerVotersBatch(addresses) {
    const contract = this._writeContract();
    const { receipt } = await this._safeSend('registerVotersBatch', [addresses]);

    const registeredCount = receipt.logs.filter((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'VoterRegistered';
      } catch {
        return false;
      }
    }).length;

    return { transactionHash: receipt.hash, registeredCount };
  }

  async prepareVoteTransaction(candidateId) {
    try {
      const contract = this._readContract();
      const data = contract.interface.encodeFunctionData('vote', [candidateId]);
      return {
        to: process.env.CONTRACT_ADDRESS,
        data,
      };
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  /**
   * Casts a vote as a specific signer (used by the demo flow). Performs
   * staticCall + estimateGas to surface reverts cleanly, then broadcasts.
   */
  async castVoteAs(privateKey, candidateId) {
    try {
      const { contract } = getContractAsSigner(privateKey);
      await contract.vote.staticCall(candidateId);
      const estimated = await contract.vote.estimateGas(candidateId);
      const gasLimit = (estimated * 120n) / 100n;
      const tx = await contract.vote(candidateId, { gasLimit });
      const receipt = await tx.wait();
      return { transactionHash: receipt.hash };
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  /**
   * Returns the list of registered voters by querying VoterRegistered events
   * and joining each address with its current registration / voting status.
   */
  async listVoters() {
    try {
      const contract = this._readContract();
      const filter = contract.filters.VoterRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');

      const seen = new Set();
      const voters = [];
      for (const ev of events) {
        const address = ev.args && ev.args[0];
        if (!address) continue;
        const lower = address.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        const status = await this.getVoterStatus(address);
        voters.push({
          address,
          isRegistered: status.isRegistered,
          hasVoted: status.hasVoted,
          votedCandidateId: status.votedCandidateId,
          registeredAt: ev.blockNumber,
        });
      }
      return voters;
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  // ── Admin check ───────────────────────────

  async isAdmin(address) {
    try {
      const contract = this._readContract();
      return await contract.isAdmin(address);
    } catch (error) {
      throw parseBlockchainError(error);
    }
  }

  // ── Helpers ───────────────────────────────

  _formatCandidate(raw) {
    return {
      id: Number(raw.id),
      name: raw.name,
      manifesto: raw.manifesto,
      voteCount: Number(raw.voteCount),
    };
  }
}

module.exports = new BlockchainService();
