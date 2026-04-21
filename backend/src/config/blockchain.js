const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

let provider;
let adminWallet;
let contract;
let contractABI;

function getABI() {
  if (contractABI) return contractABI;

  const artifactPath = path.resolve(
    __dirname,
    '../../artifacts/contracts/ClassRepVoting.sol/ClassRepVoting.json'
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      'Contract artifact not found. Run "npx hardhat compile" first.'
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  contractABI = artifact.abi;
  return contractABI;
}

function getProvider() {
  if (provider) return provider;

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) throw new Error('SEPOLIA_RPC_URL not configured');

  provider = new ethers.JsonRpcProvider(rpcUrl);
  return provider;
}

function getAdminWallet() {
  if (adminWallet) return adminWallet;

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY not configured');

  adminWallet = new ethers.Wallet(privateKey, getProvider());
  return adminWallet;
}

function getContract() {
  if (contract) return contract;

  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('CONTRACT_ADDRESS not configured');

  const abi = getABI();
  contract = new ethers.Contract(address, abi, getAdminWallet());
  return contract;
}

function getReadOnlyContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('CONTRACT_ADDRESS not configured');

  const abi = getABI();
  return new ethers.Contract(address, abi, getProvider());
}

/**
 * Returns a contract instance signed by the given raw private key.
 * Used by the demo flow so the backend can broadcast votes on behalf of a
 * seeded voter wallet (no MetaMask round-trip).
 */
function getContractAsSigner(privateKey) {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('CONTRACT_ADDRESS not configured');
  if (!privateKey) throw new Error('Signer private key required');

  const abi = getABI();
  const signer = new ethers.Wallet(privateKey, getProvider());
  return { contract: new ethers.Contract(address, abi, signer), signer };
}

/**
 * Returns the parsed list of demo voter accounts from DEMO_VOTER_KEYS.
 * Each entry is `{ address, privateKey }`. Empty array if not configured.
 */
function getDemoVoterAccounts() {
  const raw = process.env.DEMO_VOTER_KEYS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((privateKey) => {
      const wallet = new ethers.Wallet(privateKey);
      return { address: wallet.address, privateKey };
    });
}

/**
 * Returns the demo admin account from DEMO_ADMIN_KEY (defaults to the
 * server's PRIVATE_KEY when not separately configured, since the deployer
 * is the admin in this contract).
 */
function getDemoAdminAccount() {
  const privateKey = process.env.DEMO_ADMIN_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) return null;
  const wallet = new ethers.Wallet(privateKey);
  return { address: wallet.address, privateKey };
}

module.exports = {
  getProvider,
  getAdminWallet,
  getContract,
  getReadOnlyContract,
  getContractAsSigner,
  getDemoVoterAccounts,
  getDemoAdminAccount,
  getABI,
};
