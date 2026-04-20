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

module.exports = {
  getProvider,
  getAdminWallet,
  getContract,
  getReadOnlyContract,
  getABI,
};
