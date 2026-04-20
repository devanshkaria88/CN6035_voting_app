const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log('Deploying ClassRepVoting with account:', deployer.address);
  console.log(
    'Account balance:',
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    'ETH'
  );

  const ClassRepVoting = await hre.ethers.getContractFactory('ClassRepVoting');
  const voting = await ClassRepVoting.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();

  console.log('ClassRepVoting deployed to:', contractAddress);
  console.log('');
  console.log('Update your .env file:');
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log('');
  console.log('To verify on Etherscan, run:');
  console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
