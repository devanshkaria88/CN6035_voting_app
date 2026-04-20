const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClassRep Vote API',
      version: '1.0.0',
      description:
        'REST API for the Class Representative Voting System DApp. Provides endpoints for election management, candidate registration, voter registration, and vote casting backed by a Solidity smart contract on Ethereum Sepolia TestNet.',
      contact: {
        name: 'ClassRep Vote Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtained via /api/v1/auth/verify after wallet signature',
        },
      },
      schemas: {
        Candidate: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 0 },
            name: { type: 'string', example: 'Alice Johnson' },
            manifesto: { type: 'string', example: 'Better campus facilities' },
            voteCount: { type: 'integer', example: 12 },
          },
        },
        Voter: {
          type: 'object',
          properties: {
            address: { type: 'string', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
            isRegistered: { type: 'boolean', example: true },
            hasVoted: { type: 'boolean', example: false },
            votedCandidateId: { type: 'integer', nullable: true, example: null },
          },
        },
        ElectionStatus: {
          type: 'object',
          properties: {
            isStarted: { type: 'boolean', example: false },
            isEnded: { type: 'boolean', example: false },
            candidateCount: { type: 'integer', example: 3 },
            registeredVoterCount: { type: 'integer', example: 50 },
            totalVotes: { type: 'integer', example: 0 },
          },
        },
        VoteRequest: {
          type: 'object',
          required: ['candidateId'],
          properties: {
            candidateId: { type: 'integer', example: 1 },
          },
        },
        RegisterVoterRequest: {
          type: 'object',
          required: ['address'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
            },
          },
        },
        BatchRegisterRequest: {
          type: 'object',
          required: ['addresses'],
          properties: {
            addresses: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^0x[a-fA-F0-9]{40}$',
              },
              example: [
                '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
                '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
              ],
            },
          },
        },
        AddCandidateRequest: {
          type: 'object',
          required: ['name', 'manifesto'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Alice Johnson',
            },
            manifesto: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              example: 'I will improve campus facilities and student welfare.',
            },
          },
        },
        AuthNonceRequest: {
          type: 'object',
          required: ['address'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
            },
          },
        },
        AuthNonceResponse: {
          type: 'object',
          properties: {
            nonce: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            message: {
              type: 'string',
              example: 'Sign this message to authenticate with ClassRep Vote:\n\nNonce: a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
          },
        },
        AuthVerifyRequest: {
          type: 'object',
          required: ['address', 'signature'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
            },
            signature: {
              type: 'string',
              example: '0x...',
            },
          },
        },
        AuthVerifyResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            address: { type: 'string', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18' },
            role: { type: 'string', enum: ['admin', 'voter'], example: 'voter' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input provided' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Service health check' },
      { name: 'Auth', description: 'Wallet authentication' },
      { name: 'Election', description: 'Election lifecycle management' },
      { name: 'Candidates', description: 'Candidate management' },
      { name: 'Voters', description: 'Voter registration and voting' },
      { name: 'Contract', description: 'Smart contract metadata' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
