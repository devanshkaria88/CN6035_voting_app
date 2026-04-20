const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ClassRepVoting', function () {
  let voting;
  let admin;
  let voter1;
  let voter2;
  let voter3;
  let nonVoter;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    const ClassRepVoting = await ethers.getContractFactory('ClassRepVoting');
    voting = await ClassRepVoting.deploy();
    await voting.waitForDeployment();
  });

  // ──────────────────────────────────────────
  //  Deployment
  // ──────────────────────────────────────────

  describe('Deployment', function () {
    it('should set the deployer as admin', async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it('should initialise with election not started', async function () {
      expect(await voting.electionStarted()).to.equal(false);
    });

    it('should initialise with election not ended', async function () {
      expect(await voting.electionEnded()).to.equal(false);
    });

    it('should initialise with zero total votes', async function () {
      expect(await voting.totalVotes()).to.equal(0);
    });

    it('should initialise with zero registered voters', async function () {
      expect(await voting.registeredVoterCount()).to.equal(0);
    });

    it('should initialise with no candidates', async function () {
      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(0);
    });
  });

  // ──────────────────────────────────────────
  //  isAdmin
  // ──────────────────────────────────────────

  describe('isAdmin', function () {
    it('should return true for the admin address', async function () {
      expect(await voting.isAdmin(admin.address)).to.equal(true);
    });

    it('should return false for a non-admin address', async function () {
      expect(await voting.isAdmin(voter1.address)).to.equal(false);
    });
  });

  // ──────────────────────────────────────────
  //  Candidate Management
  // ──────────────────────────────────────────

  describe('addCandidate', function () {
    it('should add a candidate and return the correct ID', async function () {
      const tx = await voting.addCandidate('Alice', 'Better facilities');
      await tx.wait();

      const candidate = await voting.getCandidate(0);
      expect(candidate.id).to.equal(0);
      expect(candidate.name).to.equal('Alice');
      expect(candidate.manifesto).to.equal('Better facilities');
      expect(candidate.voteCount).to.equal(0);
    });

    it('should emit CandidateAdded event', async function () {
      await expect(voting.addCandidate('Alice', 'Better facilities'))
        .to.emit(voting, 'CandidateAdded')
        .withArgs(0, 'Alice');
    });

    it('should assign sequential IDs', async function () {
      await voting.addCandidate('Alice', 'Manifesto A');
      await voting.addCandidate('Bob', 'Manifesto B');
      await voting.addCandidate('Charlie', 'Manifesto C');

      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].id).to.equal(0);
      expect(candidates[1].id).to.equal(1);
      expect(candidates[2].id).to.equal(2);
    });

    it('should revert if called by non-admin', async function () {
      await expect(
        voting.connect(voter1).addCandidate('Alice', 'Manifesto')
      ).to.be.revertedWithCustomError(voting, 'NotAdmin');
    });

    it('should revert if election has started', async function () {
      await voting.addCandidate('Alice', 'Manifesto');
      await voting.registerVoter(voter1.address);
      await voting.startElection();

      await expect(
        voting.addCandidate('Bob', 'Manifesto')
      ).to.be.revertedWithCustomError(voting, 'ElectionAlreadyStarted');
    });

    it('should revert with empty name', async function () {
      await expect(
        voting.addCandidate('', 'Manifesto')
      ).to.be.revertedWithCustomError(voting, 'EmptyName');
    });

    it('should revert with empty manifesto', async function () {
      await expect(
        voting.addCandidate('Alice', '')
      ).to.be.revertedWithCustomError(voting, 'EmptyManifesto');
    });
  });

  describe('getCandidate', function () {
    it('should return the correct candidate', async function () {
      await voting.addCandidate('Alice', 'Manifesto A');
      const candidate = await voting.getCandidate(0);
      expect(candidate.name).to.equal('Alice');
    });

    it('should revert for invalid candidate ID', async function () {
      await expect(voting.getCandidate(0)).to.be.revertedWithCustomError(
        voting,
        'InvalidCandidateId'
      );
    });
  });

  describe('getAllCandidates', function () {
    it('should return empty array when no candidates', async function () {
      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(0);
    });

    it('should return all candidates', async function () {
      await voting.addCandidate('Alice', 'A');
      await voting.addCandidate('Bob', 'B');

      const candidates = await voting.getAllCandidates();
      expect(candidates.length).to.equal(2);
      expect(candidates[0].name).to.equal('Alice');
      expect(candidates[1].name).to.equal('Bob');
    });
  });

  // ──────────────────────────────────────────
  //  Voter Registration
  // ──────────────────────────────────────────

  describe('registerVoter', function () {
    it('should register a voter', async function () {
      await voting.registerVoter(voter1.address);
      const voter = await voting.getVoterStatus(voter1.address);
      expect(voter.isRegistered).to.equal(true);
      expect(voter.hasVoted).to.equal(false);
    });

    it('should emit VoterRegistered event', async function () {
      await expect(voting.registerVoter(voter1.address))
        .to.emit(voting, 'VoterRegistered')
        .withArgs(voter1.address);
    });

    it('should increment registeredVoterCount', async function () {
      await voting.registerVoter(voter1.address);
      expect(await voting.registeredVoterCount()).to.equal(1);
    });

    it('should revert if called by non-admin', async function () {
      await expect(
        voting.connect(voter1).registerVoter(voter1.address)
      ).to.be.revertedWithCustomError(voting, 'NotAdmin');
    });

    it('should revert for zero address', async function () {
      await expect(
        voting.registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(voting, 'InvalidAddress');
    });

    it('should revert if voter already registered', async function () {
      await voting.registerVoter(voter1.address);
      await expect(
        voting.registerVoter(voter1.address)
      ).to.be.revertedWithCustomError(voting, 'VoterAlreadyRegistered');
    });

    it('should revert if election has started', async function () {
      await voting.addCandidate('Alice', 'Manifesto');
      await voting.registerVoter(voter1.address);
      await voting.startElection();

      await expect(
        voting.registerVoter(voter2.address)
      ).to.be.revertedWithCustomError(voting, 'ElectionAlreadyStarted');
    });
  });

  describe('registerVotersBatch', function () {
    it('should register multiple voters', async function () {
      const addresses = [voter1.address, voter2.address, voter3.address];
      await voting.registerVotersBatch(addresses);

      for (const addr of addresses) {
        const voter = await voting.getVoterStatus(addr);
        expect(voter.isRegistered).to.equal(true);
      }
      expect(await voting.registeredVoterCount()).to.equal(3);
    });

    it('should emit VoterRegistered for each new voter', async function () {
      const tx = voting.registerVotersBatch([
        voter1.address,
        voter2.address,
      ]);
      await expect(tx)
        .to.emit(voting, 'VoterRegistered')
        .withArgs(voter1.address);
      await expect(tx)
        .to.emit(voting, 'VoterRegistered')
        .withArgs(voter2.address);
    });

    it('should skip already-registered voters without reverting', async function () {
      await voting.registerVoter(voter1.address);
      await voting.registerVotersBatch([voter1.address, voter2.address]);

      expect(await voting.registeredVoterCount()).to.equal(2);
    });

    it('should return the count of newly registered voters', async function () {
      await voting.registerVoter(voter1.address);

      const result = await voting.registerVotersBatch.staticCall([
        voter1.address,
        voter2.address,
      ]);
      expect(result).to.equal(1);
    });

    it('should revert with empty array', async function () {
      await expect(
        voting.registerVotersBatch([])
      ).to.be.revertedWithCustomError(voting, 'EmptyAddressArray');
    });

    it('should revert if called by non-admin', async function () {
      await expect(
        voting.connect(voter1).registerVotersBatch([voter1.address])
      ).to.be.revertedWithCustomError(voting, 'NotAdmin');
    });

    it('should revert if any address is zero', async function () {
      await expect(
        voting.registerVotersBatch([voter1.address, ethers.ZeroAddress])
      ).to.be.revertedWithCustomError(voting, 'InvalidAddress');
    });
  });

  // ──────────────────────────────────────────
  //  Election Lifecycle
  // ──────────────────────────────────────────

  describe('startElection', function () {
    beforeEach(async function () {
      await voting.addCandidate('Alice', 'Manifesto A');
      await voting.registerVoter(voter1.address);
    });

    it('should start the election', async function () {
      await voting.startElection();
      expect(await voting.electionStarted()).to.equal(true);
    });

    it('should emit ElectionStarted event', async function () {
      await expect(voting.startElection()).to.emit(voting, 'ElectionStarted');
    });

    it('should revert if called by non-admin', async function () {
      await expect(
        voting.connect(voter1).startElection()
      ).to.be.revertedWithCustomError(voting, 'NotAdmin');
    });

    it('should revert if election already started', async function () {
      await voting.startElection();
      await expect(voting.startElection()).to.be.revertedWithCustomError(
        voting,
        'ElectionAlreadyStarted'
      );
    });

    it('should revert if no candidates registered', async function () {
      const ClassRepVoting = await ethers.getContractFactory('ClassRepVoting');
      const freshVoting = await ClassRepVoting.deploy();
      await freshVoting.waitForDeployment();

      await expect(
        freshVoting.startElection()
      ).to.be.revertedWithCustomError(freshVoting, 'NoCandidatesRegistered');
    });
  });

  describe('endElection', function () {
    beforeEach(async function () {
      await voting.addCandidate('Alice', 'Manifesto A');
      await voting.addCandidate('Bob', 'Manifesto B');
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it('should end the election', async function () {
      await voting.endElection();
      expect(await voting.electionEnded()).to.equal(true);
    });

    it('should emit ElectionEnded event with winner details', async function () {
      await voting.connect(voter1).vote(0);
      await expect(voting.endElection())
        .to.emit(voting, 'ElectionEnded')
        .withArgs(0, 'Alice', 1);
    });

    it('should return the winner', async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);

      const result = await voting.endElection.staticCall();
      expect(result.winnerId).to.equal(1);
      expect(result.winnerName).to.equal('Bob');
    });

    it('should revert if called by non-admin', async function () {
      await expect(
        voting.connect(voter1).endElection()
      ).to.be.revertedWithCustomError(voting, 'NotAdmin');
    });

    it('should revert if election not started', async function () {
      const ClassRepVoting = await ethers.getContractFactory('ClassRepVoting');
      const freshVoting = await ClassRepVoting.deploy();
      await freshVoting.waitForDeployment();

      await expect(
        freshVoting.endElection()
      ).to.be.revertedWithCustomError(freshVoting, 'ElectionNotStarted');
    });

    it('should revert if election already ended', async function () {
      await voting.endElection();
      await expect(voting.endElection()).to.be.revertedWithCustomError(
        voting,
        'ElectionAlreadyEnded'
      );
    });

    it('should handle election with zero votes', async function () {
      const result = await voting.endElection.staticCall();
      expect(result.winnerId).to.equal(0);
    });
  });

  // ──────────────────────────────────────────
  //  Voting
  // ──────────────────────────────────────────

  describe('vote', function () {
    beforeEach(async function () {
      await voting.addCandidate('Alice', 'Manifesto A');
      await voting.addCandidate('Bob', 'Manifesto B');
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it('should cast a vote successfully', async function () {
      await voting.connect(voter1).vote(0);

      const candidate = await voting.getCandidate(0);
      expect(candidate.voteCount).to.equal(1);

      const voter = await voting.getVoterStatus(voter1.address);
      expect(voter.hasVoted).to.equal(true);
      expect(voter.votedCandidateId).to.equal(0);
    });

    it('should emit VoteCast event', async function () {
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, 'VoteCast')
        .withArgs(voter1.address, 0);
    });

    it('should increment totalVotes', async function () {
      await voting.connect(voter1).vote(0);
      expect(await voting.totalVotes()).to.equal(1);

      await voting.connect(voter2).vote(1);
      expect(await voting.totalVotes()).to.equal(2);
    });

    it('should revert if voter already voted', async function () {
      await voting.connect(voter1).vote(0);
      await expect(
        voting.connect(voter1).vote(1)
      ).to.be.revertedWithCustomError(voting, 'VoterAlreadyVoted');
    });

    it('should revert if voter not registered', async function () {
      await expect(
        voting.connect(nonVoter).vote(0)
      ).to.be.revertedWithCustomError(voting, 'VoterNotRegistered');
    });

    it('should revert if election not started', async function () {
      const ClassRepVoting = await ethers.getContractFactory('ClassRepVoting');
      const freshVoting = await ClassRepVoting.deploy();
      await freshVoting.waitForDeployment();
      await freshVoting.addCandidate('Alice', 'Manifesto');
      await freshVoting.registerVoter(voter1.address);

      await expect(
        freshVoting.connect(voter1).vote(0)
      ).to.be.revertedWithCustomError(freshVoting, 'ElectionNotStarted');
    });

    it('should revert if election already ended', async function () {
      await voting.endElection();
      await expect(
        voting.connect(voter1).vote(0)
      ).to.be.revertedWithCustomError(voting, 'ElectionAlreadyEnded');
    });

    it('should revert for invalid candidate ID', async function () {
      await expect(
        voting.connect(voter1).vote(99)
      ).to.be.revertedWithCustomError(voting, 'InvalidCandidateId');
    });
  });

  // ──────────────────────────────────────────
  //  View functions
  // ──────────────────────────────────────────

  describe('getElectionStatus', function () {
    it('should return correct initial status', async function () {
      const status = await voting.getElectionStatus();
      expect(status.started).to.equal(false);
      expect(status.ended).to.equal(false);
      expect(status.votes).to.equal(0);
      expect(status.voterCount).to.equal(0);
      expect(status.candidateCount).to.equal(0);
    });

    it('should reflect state changes', async function () {
      await voting.addCandidate('Alice', 'Manifesto');
      await voting.registerVoter(voter1.address);
      await voting.startElection();
      await voting.connect(voter1).vote(0);

      const status = await voting.getElectionStatus();
      expect(status.started).to.equal(true);
      expect(status.ended).to.equal(false);
      expect(status.votes).to.equal(1);
      expect(status.voterCount).to.equal(1);
      expect(status.candidateCount).to.equal(1);
    });
  });

  describe('getResults', function () {
    it('should return candidates with vote counts', async function () {
      await voting.addCandidate('Alice', 'A');
      await voting.addCandidate('Bob', 'B');
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();

      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(0);

      const results = await voting.getResults();
      expect(results[0].voteCount).to.equal(2);
      expect(results[1].voteCount).to.equal(0);
    });
  });

  describe('getWinner', function () {
    it('should return the candidate with the most votes', async function () {
      await voting.addCandidate('Alice', 'A');
      await voting.addCandidate('Bob', 'B');
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.registerVoter(voter3.address);
      await voting.startElection();

      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(0);

      const winner = await voting.getWinner();
      expect(winner.name).to.equal('Bob');
      expect(winner.voteCount).to.equal(2);
    });

    it('should revert if no candidates registered', async function () {
      await expect(voting.getWinner()).to.be.revertedWithCustomError(
        voting,
        'NoCandidatesRegistered'
      );
    });

    it('should return first candidate on tie (index 0 has priority)', async function () {
      await voting.addCandidate('Alice', 'A');
      await voting.addCandidate('Bob', 'B');
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();

      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);

      const winner = await voting.getWinner();
      expect(winner.name).to.equal('Alice');
    });
  });

  describe('getVoterStatus', function () {
    it('should return unregistered voter defaults', async function () {
      const voter = await voting.getVoterStatus(nonVoter.address);
      expect(voter.isRegistered).to.equal(false);
      expect(voter.hasVoted).to.equal(false);
      expect(voter.votedCandidateId).to.equal(0);
    });

    it('should reflect registered voter who has not voted', async function () {
      await voting.registerVoter(voter1.address);
      const voter = await voting.getVoterStatus(voter1.address);
      expect(voter.isRegistered).to.equal(true);
      expect(voter.hasVoted).to.equal(false);
    });

    it('should reflect voter who has voted', async function () {
      await voting.addCandidate('Alice', 'A');
      await voting.registerVoter(voter1.address);
      await voting.startElection();
      await voting.connect(voter1).vote(0);

      const voter = await voting.getVoterStatus(voter1.address);
      expect(voter.isRegistered).to.equal(true);
      expect(voter.hasVoted).to.equal(true);
      expect(voter.votedCandidateId).to.equal(0);
    });
  });

  // ──────────────────────────────────────────
  //  End-to-end flow
  // ──────────────────────────────────────────

  describe('Full Election Flow', function () {
    it('should complete a full election lifecycle', async function () {
      await voting.addCandidate('Alice', 'Better cafeteria');
      await voting.addCandidate('Bob', 'Longer breaks');
      await voting.addCandidate('Charlie', 'New gym equipment');

      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.registerVoter(voter3.address);

      await voting.startElection();

      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(2);
      await voting.connect(voter3).vote(2);

      const status = await voting.getElectionStatus();
      expect(status.votes).to.equal(3);

      await voting.endElection();

      const winner = await voting.getWinner();
      expect(winner.name).to.equal('Charlie');
      expect(winner.voteCount).to.equal(2);

      expect(await voting.electionEnded()).to.equal(true);
    });
  });
});
