# ClassRep Vote

A decentralised class representative voting system. The vote state lives on an Ethereum smart contract; a Node/Express API wraps the contract with REST endpoints and JWT auth; a React/Vite SPA gives admins and voters a UI on top.

Built for UEL CN6035 coursework. Targets the Sepolia testnet for "real" deployments and a local Hardhat node for everything else.

## Architecture

Three deployable units sit in one repo. They talk to each other over plain HTTP and JSON-RPC.

```
┌────────────────────────┐  REST   ┌────────────────────────┐  ethers  ┌────────────────────────┐
│  React + Vite (SPA)    │ ──────▶ │  Express API (Node 18) │ ───────▶ │  ClassRepVoting.sol    │
│  - shadcn/ui, Tailwind │         │  - JWT, Joi, Helmet    │          │  - Sepolia or Hardhat  │
│  - MetaMask + JWT      │         │  - Swagger / OpenAPI   │          │  - Election lifecycle  │
└────────────────────────┘         └────────────────────────┘          └────────────────────────┘
         ▲                                    ▲
         │  MetaMask `personal_sign`          │  JWT (Bearer)
         └──────── nonce / signature ─────────┘
```

### What lives where

| Layer | Path | Responsibility |
|---|---|---|
| Smart contract | `backend/contracts/ClassRepVoting.sol` | Source of truth for candidates, voters, and votes. Owns the entire election state machine (setup, started, ended). All mutations are gated by modifiers (`onlyAdmin`, `electionOngoing`, etc.) and revert with typed custom errors. |
| Backend API | `backend/src/` | Express 4 server. Wraps the contract with REST endpoints, validates inputs with Joi, signs admin transactions with the deployer key, and verifies wallet signatures (SIWE-style) to issue JWTs. Documents itself via Swagger at `/api-docs`. |
| Frontend SPA | `frontend/src/` | React 19 single-page app. Six routes (`/`, `/candidates`, `/vote`, `/results`, `/admin`, `/login`). State is held in three React contexts: `AuthContext` (wallet + JWT), `ElectionContext` (status + candidate cache), `ThemeContext` (light/dark/system). |

### Smart contract surface

`ClassRepVoting.sol` (Solidity 0.8.19) exposes:

- `addCandidate`, `editCandidate`, `removeCandidate` (admin, pre-election only)
- `registerVoter`, `registerVotersBatch` (admin, pre-election only)
- `startElection`, `endElection` (admin)
- `vote(candidateId)` (registered voter, election ongoing, one vote per address)
- view helpers: `getCandidate`, `getAllCandidates`, `getVoterStatus`, `getElectionStatus`, `getResults`, `getWinner`, `isAdmin`

Events (`CandidateAdded`, `VoterRegistered`, `VoteCast`, `ElectionStarted`, `ElectionEnded`) let the API reconstruct state without a separate database. There is no DB; the chain is the database.

### Backend layout

```
backend/src/
├── app.js                      Express bootstrap (helmet, cors, rate limit, swagger, routes)
├── config/
│   ├── blockchain.js           ethers provider, admin signer, contract factories, demo accounts
│   ├── database.js             placeholder (no DB)
│   └── swagger.js              OpenAPI spec assembly
├── controllers/                thin HTTP handlers
├── middleware/                 auth, validation, error formatting, rate limiter
├── routes/                     endpoint declarations + Swagger JSDoc
├── services/
│   ├── auth.service.js         nonce store, signature verification, demo login
│   └── blockchain.service.js   every contract read/write the API needs
├── validators/                 Joi schemas
└── utils/                      typed errors, response envelope, winston logger
```

Request flow: helmet, then CORS, then rate limit, then body parser, then route, then JWT auth (where mounted), then Joi validation, then controller, then service, then a uniform `{ success, data, message }` response (or `{ success: false, error: { code, message } }` on failure).

The blockchain service uses a `_safeSend(method, args)` helper that does a `staticCall` first (to surface revert reasons), then `estimateGas` with a 20% buffer, then broadcasts. Reverts come back as readable errors instead of opaque `CALL_EXCEPTION`.

### Frontend layout

```
frontend/src/
├── main.tsx                    React bootstrap
├── App.tsx                     ThemeProvider > BrowserRouter > AuthProvider
│                               > ElectionProvider > Layout + lazy routes
├── pages/                      HomePage, CandidatesPage, VotePage,
│                               ResultsPage, AdminPage, LoginPage
├── components/
│   ├── layout/                 Layout, Navbar, Footer, ThemeToggle
│   ├── candidates/, voting/, results/, admin/, wallet/
│   └── ui/                     shadcn primitives (button, card, dialog, table, ...)
├── context/                    AuthContext, ElectionContext, ThemeContext
├── services/                   axios instance + typed wrapper per endpoint, shared types
└── lib/                        ethereum provider picker, cn() helper
```

Each route is wrapped in `<Suspense>` with a skeleton fallback so the initial bundle stays small. The axios instance attaches the JWT automatically and unwraps the API's error envelope into a typed `Error & { code, status }`.

### Authentication flow

1. SPA calls `POST /api/v1/auth/nonce` with the wallet address.
2. Backend stores a UUID nonce against that address (in-memory `Map`, 5 minute TTL) and returns the message to sign.
3. User signs the message with MetaMask via `personal_sign`.
4. SPA calls `POST /api/v1/auth/verify` with the address and signature.
5. Backend recovers the signer with `ethers.verifyMessage`, looks up the role:
   - admin if `contract.isAdmin(address)` returns true,
   - voter if `getVoterStatus(address).isRegistered` is true,
   - otherwise rejects with `AuthenticationError`.
6. Backend signs and returns a JWT containing `{ address, role, isRegisteredVoter }`. Default expiry is 24h.

There is also a demo login path (`POST /api/v1/auth/demo`) that issues a JWT for a pre-seeded address without a signature challenge. It only works when `ENABLE_DEMO_LOGIN=true` in the backend environment, and is what powers the "Sign in as Demo" button on the login page.

### Vote casting

Two paths exist depending on how the user signed in:

- Wallet user: backend returns `{ to, data }` calldata; the SPA asks MetaMask to send the transaction.
- Demo user: backend signs and broadcasts the vote itself using the seeded private key (no MetaMask popup).

Either way the vote ends up at `ClassRepVoting.vote(candidateId)`, which is gated by `electionOngoing`, `isRegisteredVoter`, `notAlreadyVoted`, and `validCandidate`.

## Tech stack

| Concern | Choice |
|---|---|
| Smart contract | Solidity 0.8.19, Hardhat 2 |
| API | Node 18+, Express 4, ethers 6, joi, jsonwebtoken, helmet, express-rate-limit |
| Docs | swagger-jsdoc + swagger-ui-express |
| Tests | Hardhat/Chai for the contract, Mocha + Supertest for the API (with a chain stub) |
| SPA | React 19, TypeScript 5.9, Vite 7 |
| UI | Tailwind 4, shadcn/ui (Radix primitives), lucide-react, sonner toasts |
| Forms | react-hook-form + zod |
| Theming | next-themes (light, dark, system) |

## Repo layout

```
CN6035_voting_app/
├── backend/                    smart contract + Express API
├── frontend/                   React 19 SPA
├── README.md                   this file
├── .gitignore                  root ignore (OS junk, .cursor, env files, project notes)
└── .vscode/                    workspace settings
```

The `backend/` and `frontend/` packages are independent npm projects. There is no monorepo runner; you start each side in its own terminal.

## Quick start (local Hardhat + demo login)

This path runs everything on your laptop with no MetaMask, no Sepolia ETH, and no Infura account. Fastest way to see the app working end to end.

You will need: Node.js 18+, npm 9+.

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start a local blockchain

In one terminal:

```bash
cd backend
npx hardhat node
```

This prints 20 deterministic accounts each pre-funded with 10000 ETH. Account #0 is the deployer/admin; #1 through #9 will be the demo voters. Keep the terminal open.

### 3. Deploy and seed

In a second terminal:

```bash
cd backend
npx hardhat run scripts/deploy.js --network localhost
# prints: ClassRepVoting deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  npx hardhat run scripts/seed.js --network localhost
```

The seed script adds 3 sample candidates and registers Hardhat accounts #1 through #9 as voters.

### 4. Configure `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and paste:

```env
NODE_ENV=development
PORT=3001

SEPOLIA_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

JWT_SECRET=local-dev-secret-please-change-in-prod-min-32-chars
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:5173

ENABLE_DEMO_LOGIN=true
DEMO_ADMIN_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
DEMO_VOTER_KEYS=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d,0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

The keys above are Hardhat's well-known deterministic test keys. They are safe to commit because the same keys ship with every Hardhat install. Never reuse them on a real network.

### 5. Start the backend

In a third terminal:

```bash
cd backend
npm run dev
# ClassRep Vote API running on http://localhost:3001
# Swagger docs available at http://localhost:3001/api-docs
```

### 6. Start the frontend

In a fourth terminal:

```bash
cd frontend
VITE_EXPECTED_CHAIN_ID=0x7a69 npm run dev
# VITE ready in 259 ms
# Local: http://localhost:5173/
```

The `VITE_EXPECTED_CHAIN_ID=0x7a69` env var tells the SPA to expect chain id 31337 (Hardhat) instead of Sepolia, so the network badge does not show "Wrong network".

### 7. Use the app

Open `http://localhost:5173`, then:

1. Click Login, then "Sign in as Demo, Admin".
2. Go to Admin and click Start election.
3. Sign out, then sign in as any of the demo voters (#0 through #8).
4. Go to Vote, pick a candidate, submit. The backend broadcasts the transaction for you.
5. Check Results for live counts.
6. Sign back in as admin and click End election to finalise the winner.

## Running on Sepolia

For a real testnet deployment you will need:

- An Infura or Alchemy project with a Sepolia HTTPS RPC URL.
- A wallet funded with Sepolia ETH (use `https://sepoliafaucet.com` or `https://www.alchemy.com/faucets/ethereum-sepolia`).
- An Etherscan API key for contract verification.

Then:

```bash
cd backend

# .env points at Sepolia:
#   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<id>
#   PRIVATE_KEY=0x<funded-wallet-key>
#   ETHERSCAN_API_KEY=<key>
#   ENABLE_DEMO_LOGIN=false

npm run compile
npm run deploy:sepolia          # prints the deployed contract address
# paste the address into CONTRACT_ADDRESS in .env
npm run verify                  # optional: verifies source on Etherscan

npm run dev                     # backend on :3001
```

In another terminal:

```bash
cd frontend
npm run dev                     # no VITE_EXPECTED_CHAIN_ID needed; defaults to Sepolia
```

The deployer wallet is the admin. Connect MetaMask (on Sepolia), sign the nonce, then add candidates and register voter addresses from the Admin page. Each voter then connects their own wallet on the SPA to cast their vote.

## Testing

```bash
cd backend
npm test                  # runs both suites
npm run test:contract     # Hardhat tests for ClassRepVoting.sol
npm run test:api          # Mocha + Supertest API tests (uses a chain stub)
npm run test:coverage     # solidity-coverage report
```

The frontend has no automated test suite yet. Manual smoke testing is via the demo login flow described above.

## Useful URLs while running locally

| URL | What it serves |
|---|---|
| `http://localhost:5173` | Frontend SPA |
| `http://localhost:3001/api/v1/health` | Backend health check |
| `http://localhost:3001/api-docs` | Swagger UI |
| `http://localhost:3001/api-docs.json` | OpenAPI JSON |
| `http://127.0.0.1:8545` | Hardhat JSON-RPC (Mode A/B only) |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `SEPOLIA_RPC_URL not configured` on backend start | `.env` missing or in the wrong folder | `.env` must live in `backend/`, not the repo root |
| `Contract artifact not found. Run "npx hardhat compile" first.` | Skipped the compile step | `cd backend && npm run compile` |
| Frontend shows a "Wrong network" badge | MetaMask is on a different chain than `EXPECTED_CHAIN_ID` | For local: set `VITE_EXPECTED_CHAIN_ID=0x7a69`. For Sepolia: switch MetaMask to Sepolia. |
| `/api/v1/...` returns 404 from the SPA | Backend not running, or Vite proxy not picking it up | Confirm the backend is on `:3001`. `vite.config.ts` proxies `/api` to `http://localhost:3001`. |
| Demo login button missing | `ENABLE_DEMO_LOGIN` is not `true` | Set it in `backend/.env` and restart the backend |
| Vote tx reverts with `VoterNotRegistered` | The wallet address is not registered on the contract | Sign in as admin and register the address from Admin > Voters |
| Hardhat node restarted, frontend now shows zero candidates | Local chain state is wiped on restart | Re-run `deploy.js` and `seed.js`. Update `CONTRACT_ADDRESS` if it changed. |
| MetaMask "nonce too high / too low" on local Hardhat | MetaMask cached an old nonce after a Hardhat restart | MetaMask > Settings > Advanced > Clear activity tab data |
| MetaMask connect times out, message blames Trust Wallet | Multiple wallet extensions installed | Disable Trust/Coinbase/Brave wallets, or set MetaMask as default in its Settings > Experimental |

## Known limitations

- Single admin: the deployer is the admin and there is no transfer flow. Losing the key locks the contract.
- Tie-breaking on `endElection` picks whichever tied candidate appears first in iteration order. The frontend does not warn about this.
- The auth nonce store is in-memory, so restarting the backend invalidates pending nonces and horizontal scaling will not work without a shared store (Redis).
- Rate limiter is process-local for the same reason.
- `registerVotersBatch` has no length cap; very large arrays may exceed the block gas limit.
- No CI yet. No frontend test suite yet.
- `JWT_SECRET` is read lazily; the server should fail fast at startup if it is missing.

## Licence

MIT.
