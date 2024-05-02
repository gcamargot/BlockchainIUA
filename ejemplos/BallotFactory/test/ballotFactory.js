"use strict";
const Ballot = artifacts.require("Ballot");
const Factory = artifacts.require("BallotFactory");


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

async function newBallot(factory, proposal, account) {
  await factory.create(proposal, { 'from': account });
  let address = await factory.lastBy(account)
  let contract = await Ballot.at(address)
  return contract
}

function randint(upperBound) {
  return Math.floor(Math.random() * upperBound)
}

function choice(array) {
  return array[randint(array.length)]
}

contract('BallotFactory', (accounts) => {
  describe("Creación", function () {
    var factory
    var ballots = {}
    var ballotCount = 5 * accounts.length
    let testBallots = 0
    let testAccount
    before(async function () {
      factory = await Factory.new()
      for (let i = 0; i < ballotCount; i++) {
        let account = choice(accounts)
        let proposal = account + i
        await factory.create(proposal, { 'from': account })
        let address = await factory.lastBy(account)
        let ballot = await Ballot.at(address)
        if (ballots[account]) {
          ballots[account].push(ballot)
        } else {
          ballots[account] = [ballot]
        }
      }
    });

    it("debería tener valores iniciales correctos", async () => {
      let createdCount = (await factory.createdCount()).toNumber();
      assert.equal(createdCount, ballotCount, "createdCount() no es correcto");
      let runningCount = (await factory.runningCount()).toNumber();
      assert.equal(runningCount, 0, "runningCount() no es correcto");
      let endedCount = (await factory.endedCount()).toNumber();
      assert.equal(endedCount, 0, "endedCount() no es correcto");
    });
    it("debería saber cuantas votaciones creó cada cuenta", async () => {
      for (let account of accounts) {
        let createdByCount = (await factory.createdByCount(account)).toNumber()
        assert.equal(createdByCount, ballots[account].length)
      }
    });
    it("debería saber que votaciones creó cada cuenta", async () => {
      for (let account of accounts) {
        for (let i in ballots[account]) {
          let ballot = ballots[account][i]
          let address = await factory.createdBy(account, i)
          assert.equal(address, ballot.address, "Dirección de votación incorrecta")
        }
      }
    });
    it("debería reconocer los inicios de votación", async () => {
      let createdCount = ballotCount
      let runningCount = 0
      let endedCount = 0
      while (testBallots < 5) {
        testAccount = choice(accounts)
        testBallots = ballots[testAccount].length
      }
      for (let i in ballots[testAccount]) {
        let ballot = ballots[testAccount][i]
        await ballot.start({ 'from': testAccount })
        createdCount--
        runningCount++
        let created = (await factory.createdCount()).toNumber()
        assert.equal(created, createdCount, "Número de votaciones creadas incorrecto")
        let running = (await factory.runningCount()).toNumber()
        assert.equal(running, runningCount, "Número de votaciones comenzadas incorrecto")
        let address = await factory.running(i)
        assert.equal(address, ballot.address, "Dirección de votación comenzada incorrecta")
      }
    });
    it("debería reconocer los fines de votación", async () => {
      let createdCount = ballotCount - testBallots
      let runningCount = testBallots
      let endedCount = 0
      for (let i in ballots[testAccount]) {
        let ballot = ballots[testAccount][i]
        await ballot.end({ 'from': testAccount })
        runningCount--
        endedCount++
        let created = (await factory.createdCount()).toNumber()
        assert.equal(created, createdCount, "Número de votaciones creadas incorrecto")
        let running = (await factory.runningCount()).toNumber()
        assert.equal(running, runningCount, "Número de votaciones comenzadas incorrecto")
        let ended = (await factory.endedCount()).toNumber()
        assert.equal(ended, endedCount, "Número de votaciones finalizadas incorrecto")
        let address = await factory.ended(i)
        assert.equal(address, ballot.address, "Dirección de votación comenzada incorrecta")
      }
    });
  });
});

