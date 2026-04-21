/**
 * Demo helper: starts the election and casts a few votes from the seeded
 * voter accounts so the Results page shows real numbers during E2E tests.
 */
const hre = require('hardhat');

async function main() {
  const [admin, voter1, voter2, voter3] = await hre.ethers.getSigners();
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('Set CONTRACT_ADDRESS first');

  const ClassRepVoting = await hre.ethers.getContractFactory('ClassRepVoting');
  const voting = ClassRepVoting.attach(address);

  const status = await voting.getElectionStatus();
  if (!status[0]) {
    console.log('Starting election...');
    const tx = await voting.connect(admin).startElection();
    await tx.wait();
  }

  const cast = async (signer, candidateId) => {
    const v = await voting.getVoterStatus(signer.address);
    if (v.hasVoted) {
      console.log(`${signer.address} already voted`);
      return;
    }
    const tx = await voting.connect(signer).vote(candidateId);
    await tx.wait();
    console.log(`${signer.address} voted for candidate #${candidateId}`);
  };

  await cast(voter1, 0);
  await cast(voter2, 0);
  await cast(voter3, 1);

  const final = await voting.getElectionStatus();
  console.log('\nFinal status:');
  console.log('  totalVotes:', final[2].toString());
  console.log('  voterCount:', final[3].toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
