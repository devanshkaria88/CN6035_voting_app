const hre = require('hardhat');

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error('CONTRACT_ADDRESS not set in environment variables');
    process.exit(1);
  }

  console.log('Verifying contract at:', contractAddress);

  await hre.run('verify:verify', {
    address: contractAddress,
    constructorArguments: [],
  });

  console.log('Contract verified on Etherscan');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
