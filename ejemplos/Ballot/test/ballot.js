/* eslint-disable no-undef */
const Ballot = artifacts.require("Ballot");

const languages = ["Alemán", "Búlgaro", "Chino", "Danés", "Español"];
const options = languages.map(web3.utils.stringToHex);


async function verifyThrows(pred, message) {
	let e;
	try {
		await pred();
	} catch (ex) {
		e = ex;
	}
	assert.throws(() => {
		if (e) { throw e; }
	}, message);
}

contract("Ballot", (accounts) => {
	it("should have at least two options", async () => {
		const BallotInstance = await Ballot.deployed();
		const numProposals = await BallotInstance.numProposals();

		assert(numProposals.valueOf() > 1, "There aren't at least two proposals");
	});
	it("no account should be allowed to vote", async () => {
		const BallotInstance = await Ballot.deployed();
		for (let account of accounts) {
			let canVote = (await BallotInstance.voters(account)).canVote;
			assert(!canVote, `${account} shouldn't be allowed to vote`);
		}
	});
	it("should give the right to vote correctly", async () => {
		const BallotInstance = await Ballot.deployed();
		for (let account of accounts) {
			await BallotInstance.giveRightToVote(account);
			let canVote = (await BallotInstance.voters(account)).canVote;
			assert(canVote, `${account} should be allowed to vote`);
		}
	});
	it("should register the vote correctly", async () => {
		const BallotInstance = await Ballot.new(options);
		let numProposals = (await BallotInstance.numProposals()).toNumber();
		let votes = Array(numProposals).fill(0);
		for (let i = 0; i < accounts.length; i++) {
			let voter = accounts[i];
			let proposal = i % 2 ? i % numProposals : 1;
			await BallotInstance.giveRightToVote(voter);
			await BallotInstance.vote(proposal, { "from": voter });
			votes[proposal] += 1;
			let voterStatus = await BallotInstance.voters(voter);
			assert.equal(proposal, voterStatus.vote,
				`Voter ${i} voted for proposal ${proposal}, but proposal ${voterStatus.vote.toNumber()} was recorded`);
			assert(voterStatus.voted, `The vote was not registered for voter ${i}`);
		}
		for (let proposal = 0; proposal < numProposals; proposal++) {
			let proposalStatus = await BallotInstance.proposals(proposal);
			let voteCount = proposalStatus.voteCount.toNumber();
			assert.equal(votes[proposal], voteCount,
				`There were ${votes[proposal]} votes for proposal ${proposal} but ${voteCount} were recorded`);
		}
	});
	it("should reject double voting", async () => {
		const BallotInstance = await Ballot.new(options);
		for (let i = 0; i < accounts.length; i++) {
			let voter = accounts[i];
			await BallotInstance.giveRightToVote(voter);
			await BallotInstance.vote(0, { "from": voter });
			await verifyThrows(async () => {
				await BallotInstance.vote(0, { "from": voter });
			}, /revert/);
		}
	});
	it("should return the correct winner", async () => {
		let voter = accounts[0];
		for (let i = 0; i < options.length; i++) {
			const BallotInstance = await Ballot.new(options);
			await BallotInstance.giveRightToVote(voter);
			await BallotInstance.vote(i);
			let winningProposal = (await BallotInstance.winningProposal()).toNumber();
			assert.equal(winningProposal, i, `the winning proposal is ${winningProposal}, should be ${i}`);
		}
	});
});
