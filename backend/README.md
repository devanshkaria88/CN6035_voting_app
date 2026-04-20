# ClassRep Vote — Backend

Class Representative Voting System built on Ethereum Sepolia TestNet. A Solidity smart contract manages the election lifecycle, while a Node.js/Express API exposes RESTful endpoints documented via Swagger/OpenAPI 3.0.

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher
- An **Infura** (or Alchemy) project with Sepolia access
- A funded **Sepolia** wallet (get test ETH from a faucet)
- An **Etherscan** API key (for contract verification)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `SEPOLIA_RPC_URL` | Infura/Alchemy Sepolia endpoint |
| `PRIVATE_KEY` | Deployer wallet private key (with 0x prefix) |
| `JWT_SECRET` | Random string, minimum 32 characters |
| `ETHERSCAN_API_KEY` | Etherscan API key |
| `CORS_ORIGIN` | Frontend URL (default `http://localhost:5173`) |

### 3. Compile the smart contract

```bash
npm run compile
```

### 4. Run smart contract tests

```bash
npm test
```

For coverage report:

```bash
npm run test:coverage
```

### 5. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Copy the deployed contract address and add it to `.env` as `CONTRACT_ADDRESS`.

### 6. Verify on Etherscan

```bash
npm run verify
```

### 7. Start the API server

Development (with hot reload):

```bash
npm run dev
```

Production:

```bash
npm start
```

The server starts on `http://localhost:3001` by default.

---

## API Documentation

Once the server is running:

- **Swagger UI:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **OpenAPI JSON:** [http://localhost:3001/api-docs.json](http://localhost:3001/api-docs.json)

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/nonce` | Generate sign-in nonce |
| POST | `/api/v1/auth/verify` | Verify signature, get JWT |

### Election

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/election/status` | Public | Get election state |
| POST | `/api/v1/election/start` | Admin | Start voting period |
| POST | `/api/v1/election/end` | Admin | End election |
| GET | `/api/v1/election/results` | Public | Get vote counts |
| GET | `/api/v1/election/winner` | Public | Get leading candidate |

### Candidates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/candidates` | Public | List all candidates |
| GET | `/api/v1/candidates/:id` | Public | Get candidate by ID |
| POST | `/api/v1/candidates` | Admin | Add new candidate |

### Voters

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/voters/:address` | Public | Get voter status |
| POST | `/api/v1/voters/register` | Admin | Register single voter |
| POST | `/api/v1/voters/register-batch` | Admin | Register multiple voters |
| POST | `/api/v1/voters/vote` | Voter | Cast a vote |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Service health check |
| GET | `/api/v1/contract/address` | Deployed contract address |
| GET | `/api/v1/contract/abi` | Contract ABI JSON |

---

## Authentication Flow

1. Frontend calls `POST /api/v1/auth/nonce` with the wallet address
2. User signs the returned message in MetaMask
3. Frontend calls `POST /api/v1/auth/verify` with the address and signature
4. Backend returns a JWT containing the wallet address and role (`admin` or `voter`)
5. Include the JWT in subsequent requests: `Authorization: Bearer <token>`

---

## Project Structure

```
├── contracts/
│   └── ClassRepVoting.sol          # Solidity smart contract
├── scripts/
│   ├── deploy.js                   # Deployment script
│   └── verify.js                   # Etherscan verification
├── test/
│   └── ClassRepVoting.test.js      # Contract test suite
├── src/
│   ├── app.js                      # Express entry point
│   ├── config/
│   │   ├── blockchain.js           # Ethers.js provider & contract
│   │   └── swagger.js              # OpenAPI specification
│   ├── controllers/                # Request handlers
│   ├── services/                   # Business logic
│   ├── routes/                     # Endpoint definitions with Swagger JSDoc
│   ├── middleware/                  # Auth, validation, error handling
│   ├── validators/                 # Joi validation schemas
│   └── utils/                      # Errors, response helpers, logger
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start API server |
| `npm run dev` | Start with hot reload (nodemon) |
| `npm run compile` | Compile smart contract |
| `npm test` | Run contract tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run deploy:sepolia` | Deploy contract to Sepolia |
| `npm run verify` | Verify contract on Etherscan |
| `npm run lint:sol` | Lint Solidity files |
| `npm run lint` | Lint JavaScript files |
| `npm run format` | Format all files with Prettier |

---

## Licence

MIT
