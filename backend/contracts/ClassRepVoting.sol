// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title ClassRepVoting
 * @notice A decentralised class representative voting system.
 * @dev Manages candidate registration, voter registration, and vote casting
 *      with strict access control and election lifecycle management.
 */
contract ClassRepVoting {
    // ──────────────────────────────────────────────
    //  Type declarations
    // ──────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string name;
        string manifesto;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    // ──────────────────────────────────────────────
    //  State variables
    // ──────────────────────────────────────────────

    address public admin;
    bool public electionStarted;
    bool public electionEnded;

    mapping(address => Voter) public voters;
    Candidate[] public candidates;

    uint256 public totalVotes;
    uint256 public registeredVoterCount;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event CandidateAdded(uint256 indexed id, string name);
    event CandidateUpdated(uint256 indexed id, string name);
    event CandidateRemoved(uint256 indexed id);
    event VoterRegistered(address indexed voterAddress);
    event VoteCast(address indexed voterAddress, uint256 indexed candidateId);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 winnerId, string winnerName, uint256 voteCount);

    // ──────────────────────────────────────────────
    //  Custom errors
    // ──────────────────────────────────────────────

    error NotAdmin();
    error ElectionAlreadyStarted();
    error ElectionNotStarted();
    error ElectionAlreadyEnded();
    error ElectionNotEnded();
    error ElectionStillOngoing();
    error InvalidCandidateId(uint256 candidateId);
    error VoterAlreadyRegistered(address voter);
    error VoterNotRegistered(address voter);
    error VoterAlreadyVoted(address voter);
    error InvalidAddress();
    error NoCandidatesRegistered();
    error EmptyName();
    error EmptyManifesto();
    error EmptyAddressArray();

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier electionNotStarted() {
        if (electionStarted) revert ElectionAlreadyStarted();
        _;
    }

    modifier electionOngoing() {
        if (!electionStarted) revert ElectionNotStarted();
        if (electionEnded) revert ElectionAlreadyEnded();
        _;
    }

    modifier electionHasEnded() {
        if (!electionEnded) revert ElectionNotEnded();
        _;
    }

    modifier validCandidate(uint256 _candidateId) {
        if (_candidateId >= candidates.length)
            revert InvalidCandidateId(_candidateId);
        _;
    }

    modifier notAlreadyVoted(address _voter) {
        if (voters[_voter].hasVoted) revert VoterAlreadyVoted(_voter);
        _;
    }

    modifier isRegisteredVoter(address _voter) {
        if (!voters[_voter].isRegistered) revert VoterNotRegistered(_voter);
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  External / Admin functions
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new candidate for the election.
     * @param _name       Candidate's full name.
     * @param _manifesto  Candidate's campaign statement.
     * @return id         The newly assigned candidate ID.
     */
    function addCandidate(
        string calldata _name,
        string calldata _manifesto
    ) external onlyAdmin electionNotStarted returns (uint256) {
        if (bytes(_name).length == 0) revert EmptyName();
        if (bytes(_manifesto).length == 0) revert EmptyManifesto();

        uint256 id = candidates.length;
        candidates.push(Candidate({
            id: id,
            name: _name,
            manifesto: _manifesto,
            voteCount: 0
        }));

        emit CandidateAdded(id, _name);
        return id;
    }

    /**
     * @notice Update an existing candidate's name and manifesto.
     * @dev Only callable by admin before the election starts.
     * @param _candidateId  The ID of the candidate to update.
     * @param _name         New candidate name (non-empty).
     * @param _manifesto    New campaign statement (non-empty).
     */
    function editCandidate(
        uint256 _candidateId,
        string calldata _name,
        string calldata _manifesto
    )
        external
        onlyAdmin
        electionNotStarted
        validCandidate(_candidateId)
    {
        if (bytes(_name).length == 0) revert EmptyName();
        if (bytes(_manifesto).length == 0) revert EmptyManifesto();

        candidates[_candidateId].name = _name;
        candidates[_candidateId].manifesto = _manifesto;

        emit CandidateUpdated(_candidateId, _name);
    }

    /**
     * @notice Remove a candidate from the election.
     * @dev Uses swap-and-pop to keep the array compact. The last candidate's
     *      ID is rewritten to the removed slot's ID so external integrations
     *      that cached IDs see consistent on-chain state. Only callable by
     *      admin before the election starts.
     * @param _candidateId  The ID of the candidate to remove.
     */
    function removeCandidate(
        uint256 _candidateId
    )
        external
        onlyAdmin
        electionNotStarted
        validCandidate(_candidateId)
    {
        uint256 lastIndex = candidates.length - 1;
        if (_candidateId != lastIndex) {
            Candidate memory moved = candidates[lastIndex];
            moved.id = _candidateId;
            candidates[_candidateId] = moved;
        }
        candidates.pop();

        emit CandidateRemoved(_candidateId);
    }

    /**
     * @notice Register a single voter by wallet address.
     * @param _voterAddress  The address to register.
     * @return success       True if registration succeeded.
     */
    function registerVoter(
        address _voterAddress
    ) external onlyAdmin electionNotStarted returns (bool) {
        if (_voterAddress == address(0)) revert InvalidAddress();
        if (voters[_voterAddress].isRegistered)
            revert VoterAlreadyRegistered(_voterAddress);

        voters[_voterAddress].isRegistered = true;
        registeredVoterCount++;

        emit VoterRegistered(_voterAddress);
        return true;
    }

    /**
     * @notice Register multiple voters in a single transaction.
     * @param _voterAddresses  Array of addresses to register.
     * @return count            Number of newly registered voters.
     */
    function registerVotersBatch(
        address[] calldata _voterAddresses
    ) external onlyAdmin electionNotStarted returns (uint256) {
        if (_voterAddresses.length == 0) revert EmptyAddressArray();

        uint256 count = 0;
        for (uint256 i = 0; i < _voterAddresses.length; i++) {
            address addr = _voterAddresses[i];
            if (addr == address(0)) revert InvalidAddress();
            if (!voters[addr].isRegistered) {
                voters[addr].isRegistered = true;
                registeredVoterCount++;
                count++;
                emit VoterRegistered(addr);
            }
        }
        return count;
    }

    /**
     * @notice Activate the voting period.
     * @return success  True if election started.
     */
    function startElection()
        external
        onlyAdmin
        electionNotStarted
        returns (bool)
    {
        if (candidates.length == 0) revert NoCandidatesRegistered();

        electionStarted = true;
        emit ElectionStarted(block.timestamp);
        return true;
    }

    /**
     * @notice End the election and determine the winner.
     * @return winnerId    ID of the winning candidate.
     * @return winnerName  Name of the winning candidate.
     */
    function endElection()
        external
        onlyAdmin
        electionOngoing
        returns (uint256 winnerId, string memory winnerName)
    {
        electionEnded = true;

        uint256 highestVotes = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerId = candidates[i].id;
                winnerName = candidates[i].name;
            }
        }

        emit ElectionEnded(winnerId, winnerName, highestVotes);
        return (winnerId, winnerName);
    }

    // ──────────────────────────────────────────────
    //  External / Voter functions
    // ──────────────────────────────────────────────

    /**
     * @notice Cast a vote for a candidate.
     * @param _candidateId  The ID of the candidate to vote for.
     * @return success      True if the vote was recorded.
     */
    function vote(
        uint256 _candidateId
    )
        external
        electionOngoing
        isRegisteredVoter(msg.sender)
        notAlreadyVoted(msg.sender)
        validCandidate(_candidateId)
        returns (bool)
    {
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId);
        return true;
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /**
     * @notice Retrieve a single candidate by ID.
     * @param _candidateId  The candidate's ID.
     * @return candidate    The Candidate struct.
     */
    function getCandidate(
        uint256 _candidateId
    ) external view validCandidate(_candidateId) returns (Candidate memory) {
        return candidates[_candidateId];
    }

    /**
     * @notice Retrieve all registered candidates.
     * @return allCandidates  Array of Candidate structs.
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Check a voter's registration and voting status.
     * @param _voterAddress  The voter's wallet address.
     * @return voter         The Voter struct.
     */
    function getVoterStatus(
        address _voterAddress
    ) external view returns (Voter memory) {
        return voters[_voterAddress];
    }

    /**
     * @notice Get the current election state.
     * @return started     Whether the election has started.
     * @return ended       Whether the election has ended.
     * @return votes       Total votes cast so far.
     * @return voterCount  Total registered voters.
     * @return candidateCount  Total candidates.
     */
    function getElectionStatus()
        external
        view
        returns (
            bool started,
            bool ended,
            uint256 votes,
            uint256 voterCount,
            uint256 candidateCount
        )
    {
        return (
            electionStarted,
            electionEnded,
            totalVotes,
            registeredVoterCount,
            candidates.length
        );
    }

    /**
     * @notice Get voting results for all candidates.
     * @return results  Array of candidates with their vote counts.
     */
    function getResults() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Get the candidate with the most votes.
     * @return winner  The leading Candidate struct.
     */
    function getWinner() external view returns (Candidate memory winner) {
        if (candidates.length == 0) revert NoCandidatesRegistered();

        uint256 highestVotes = 0;
        uint256 winnerIndex = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }
        return candidates[winnerIndex];
    }

    /**
     * @notice Check whether an address is the contract admin.
     * @param _address  The address to check.
     * @return isAdminAddress  True if the address is admin.
     */
    function isAdmin(address _address) external view returns (bool) {
        return _address == admin;
    }
}
