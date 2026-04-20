class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'SIGNATURE_INVALID');
  }
}

class AuthorisationError extends AppError {
  constructor(message = 'Insufficient permissions', code = 'NOT_ADMIN') {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

class BlockchainError extends AppError {
  constructor(message = 'Blockchain transaction failed', details = null) {
    super(message, 500, 'BLOCKCHAIN_ERROR', details);
  }
}

const BLOCKCHAIN_ERROR_MAP = {
  NotAdmin: { status: 403, code: 'NOT_ADMIN', message: 'Only the admin can perform this action' },
  ElectionAlreadyStarted: { status: 400, code: 'ELECTION_ALREADY_STARTED', message: 'Election has already started' },
  ElectionNotStarted: { status: 400, code: 'ELECTION_NOT_STARTED', message: 'Election has not started yet' },
  ElectionAlreadyEnded: { status: 400, code: 'ELECTION_ALREADY_ENDED', message: 'Election has already ended' },
  ElectionNotEnded: { status: 400, code: 'ELECTION_NOT_ENDED', message: 'Election has not ended yet' },
  InvalidCandidateId: { status: 404, code: 'INVALID_CANDIDATE', message: 'Candidate ID does not exist' },
  VoterAlreadyRegistered: { status: 400, code: 'ALREADY_REGISTERED', message: 'Voter is already registered' },
  VoterNotRegistered: { status: 403, code: 'NOT_REGISTERED', message: 'Address is not registered as a voter' },
  VoterAlreadyVoted: { status: 400, code: 'ALREADY_VOTED', message: 'Voter has already cast a vote' },
  InvalidAddress: { status: 400, code: 'INVALID_ADDRESS', message: 'Invalid Ethereum address provided' },
  NoCandidatesRegistered: { status: 400, code: 'NO_CANDIDATES', message: 'No candidates have been registered' },
  EmptyName: { status: 400, code: 'VALIDATION_ERROR', message: 'Candidate name cannot be empty' },
  EmptyManifesto: { status: 400, code: 'VALIDATION_ERROR', message: 'Candidate manifesto cannot be empty' },
  EmptyAddressArray: { status: 400, code: 'VALIDATION_ERROR', message: 'Address array cannot be empty' },
};

function parseBlockchainError(error) {
  const revertData = error.revert || error.data;
  if (revertData && revertData.name && BLOCKCHAIN_ERROR_MAP[revertData.name]) {
    const mapped = BLOCKCHAIN_ERROR_MAP[revertData.name];
    return new AppError(mapped.message, mapped.status, mapped.code);
  }

  const errorString = error.message || '';
  for (const [errorName, mapped] of Object.entries(BLOCKCHAIN_ERROR_MAP)) {
    if (errorString.includes(errorName)) {
      return new AppError(mapped.message, mapped.status, mapped.code);
    }
  }

  return new BlockchainError('Blockchain transaction failed', {
    reason: error.shortMessage || error.message,
  });
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorisationError,
  NotFoundError,
  BlockchainError,
  parseBlockchainError,
};
