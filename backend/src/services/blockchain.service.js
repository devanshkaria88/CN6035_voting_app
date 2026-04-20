const { getContract, getReadOnlyContract } = require('../config/blockchain');
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
    const contract = this._writeContract();
    const { receipt } = await this._executeTx(contract.startElection());
    return { transactionHash: receipt.hash };
  }

  async endElection() {
    const contract = this._writeContract();
    const { receipt } = await this._executeTx(contract.endElection());

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
    const { receipt } = await this._executeTx(
      contract.addCandidate(name, manifesto)
    );

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
    const contract = this._writeContract();
    const { receipt } = await this._executeTx(
      contract.registerVoter(address)
    );
    return { transactionHash: receipt.hash };
  }

  async registerVotersBatch(addresses) {
    const contract = this._writeContract();
    const { receipt } = await this._executeTx(
      contract.registerVotersBatch(addresses)
    );

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
