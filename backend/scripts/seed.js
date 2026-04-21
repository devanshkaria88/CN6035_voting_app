/**
 * Seeds the locally-deployed contract with sample candidates and voters so the
 * frontend can render meaningful data during manual / Chrome DevTools testing.
 */
const hre = require('hardhat');

async function main() {
  const signers = await hre.ethers.getSigners();
  const [admin, ...voterSigners] = signers;
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('Set CONTRACT_ADDRESS first');

  const ClassRepVoting = await hre.ethers.getContractFactory('ClassRepVoting');
  const voting = ClassRepVoting.attach(address).connect(admin);

  console.log('Seeding contract at', address);
  console.log('Admin:', admin.address);

  const candidates = [
    {
      name: 'Sheldon Cooper',
      manifesto:
        'Bazinga! Vote for empirical decision-making, optimised study schedules, and a strict adherence to the Roommate Agreement for the entire cohort.',
    },
    {
      name: 'Leonard Hofstadter',
      manifesto:
        'I will champion practical lab access, fair group-work policies, and a rep who actually shows up to listen — not just to lecture.',
    },
    {
      name: 'Penny Hofstadter',
      manifesto:
        'Real talk: better social spaces, transparent grading, and a rep who can talk to faculty AND students without making it weird.',
    },
  ];

  // Avoid double-seeding when re-run against a stateful local node.
  const existing = await voting.getAllCandidates();
  if (existing.length === 0) {
    for (const c of candidates) {
      const tx = await voting.addCandidate(c.name, c.manifesto);
      await tx.wait();
      console.log('Added candidate:', c.name);
    }
  } else {
    console.log(
      `Skipping candidate seed — contract already has ${existing.length} candidate(s).`
    );
  }

  // Register the first 9 non-admin Hardhat accounts so the demo voter
  // picker has 9 ready-to-go identities.
  const voters = voterSigners.slice(0, 9).map((s) => s.address);
  const toRegister = [];
  for (const addr of voters) {
    const status = await voting.getVoterStatus(addr);
    if (!status.isRegistered) toRegister.push(addr);
  }
  if (toRegister.length > 0) {
    const batchTx = await voting.registerVotersBatch(toRegister);
    await batchTx.wait();
    console.log(`Registered ${toRegister.length} voter(s):`);
    toRegister.forEach((a, i) => console.log(`  #${i + 1}`, a));
  } else {
    console.log('All 9 demo voters already registered.');
  }

  const status = await voting.getElectionStatus();
  console.log('\nElection status:');
  console.log('  started:', status[0]);
  console.log('  ended:', status[1]);
  console.log('  totalVotes:', status[2].toString());
  console.log('  voterCount:', status[3].toString());
  console.log('  candidateCount:', status[4].toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
