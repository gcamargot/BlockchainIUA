"use strict";
const Ballot = artifacts.require("Ballot");
const Factory = artifacts.require("BallotFactory");
const proposal = "Asado el domingo"


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

async function newBallot(proposal, account) {
  let factory = await Factory.new();
  await factory.create(proposal, { 'from': account });
  let address = await factory.lastBy(account)
  let contract = await Ballot.at(address)
  return contract
}

contract('Ballot', (accounts) => {
  const chairperson = accounts[0];
  describe("Inicialización", function () {
    var BallotInstance;
    before(async function () {
      BallotInstance = await newBallot(proposal, chairperson);
    });

    it(`debería devolver la propuesta correcta`, async () => {
      let ballotProposal = await BallotInstance.proposal();

      assert.equal(proposal, ballotProposal, `propuesta incorrecta`);
    });
    it("debería tener valores iniciales correctos", async () => {
      let started = await BallotInstance.started();
      assert(!started, "started() no es falso");
      let ended = await BallotInstance.ended();
      assert(!ended, "ended() no es falso");
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      assert.equal(numVoters, 0, "numVoters no es cero");
    });
    it("ambas opciones deberían tener cero votos", async () => {
      let yesno = await BallotInstance.result();
      assert.equal(yesno['0'], 0, `Los votos por si no son cero`);
      assert.equal(yesno['1'], 0, `Los votos por no no son cero`);
    });
  });
  describe("Antes de comenzar", function () {
    var BallotInstance;
    before(async function () {
      BallotInstance = await newBallot("Asado este domingo", chairperson);
    });
    it("Solo el organizador puede dar derecho a votar", async () => {
      await verifyThrows(async () => {
        await BallotInstance.giveRightToVote(accounts[0], { 'from': accounts[1] });
      }, /Solo el organizador/);
    });
    it('solo se puede dar derecho a votar a votantes registrados', async () => {
      for (let account of accounts) {
        await verifyThrows(async () => {
          await BallotInstance.giveRightToVote(account);
        }, /El votante no se ha registrado/);
      }
    });
    it('debería permitir registrarse', async () => {
      for (let account of accounts) {
        await BallotInstance.register({ 'from': account })
        let canVote = await BallotInstance.isRegistered(account);
        assert(canVote, `${account} debería estar registrado`)
      }
    });
    it('debería asignar el derecho a votar correctamente', async () => {
      for (let account of accounts) {
        await BallotInstance.giveRightToVote(account)
        let canVote = await BallotInstance.canVote(account);
        assert(canVote, `${account} debería poder votar`)
      }
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      assert.equal(numVoters, accounts.length, "Se registró un número incorrecto de votantes");
    });
    it("debería devolver la dirección de los votantes en el orden en que se han registrado", async () => {
      for (let i in accounts) {
        let voter = await BallotInstance.voterAddress(i);
        assert.equal(voter, accounts[i], "votante en orden incorrecto");
      }
    });
    it('no debería permitir votar antes del comienzo', async () => {
      for (let account of accounts) {
        let canVote = (await BallotInstance.voters(account)).canVote;
        await verifyThrows(async () => {
          if (canVote)
            await BallotInstance.vote(0, { 'from': account });
        }, /no ha comenzado/);
      }
    });
    it('no debería permitir terminar antes del inicio', async () => {
      await verifyThrows(async () => {
        await BallotInstance.end();
      }, /no ha comenzado/);
    });
    it('Solo el organizador puede comenzar la votación', async () => {
      await verifyThrows(async () => {
        await BallotInstance.start({ 'from': accounts[1] });
      }, /Solo el organizador/);
    });
    it("debe emitir el evento VotingStarted al comenzar", async () => {
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      let txr = await BallotInstance.start();
      let blockNumber = txr.receipt.blockNumber;
      let eventLog = undefined;
      for (let log of txr.logs) {
        if (log.event == "VotingStarted") {
          eventLog = log;
          break;
        }
      }
      assert(eventLog != undefined, "No se emitió el evento VotingStarted");
      assert.equal(eventLog.args.blockNumber.toNumber(), blockNumber, "Evento con número de bloque incorrecto");
      assert.equal(eventLog.args.numVoters.toNumber(), numVoters, "Evento con número de votantes incorrecto");
    });
  });
  describe("Votación", function () {
    var BallotInstance;
    before(async function () {
      BallotInstance = await newBallot(proposal, chairperson);
      for (let i in accounts) {
        if (i % 2) {
          await BallotInstance.register({ 'from': accounts[i] })
          await BallotInstance.giveRightToVote(accounts[i])
        }
      }
      await BallotInstance.start();
    });
    it(`debería devolver la propuesta correcta`, async () => {
      let ballotProposal = await BallotInstance.proposal();

      assert.equal(proposal, ballotProposal, `propuesta incorrecta`);
    });
    it("debería tener valores iniciales correctos", async () => {
      let started = await BallotInstance.started();
      assert(started, "starte() no es verdadero");
      let ended = await BallotInstance.ended();
      assert(!ended, "ended() no es falso");
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      assert.equal(numVoters, Math.floor(accounts.length / 2), "numVoters no es correcto");
    });
    it("ambas opciones deberían tener cero votos", async () => {
      let yesno = await BallotInstance.result();
      assert.equal(yesno['0'], 0, `Los votos por si no son cero`);
      assert.equal(yesno['1'], 0, `Los votos por no no son cero`);
    });
    it('no debería permitir comenzar nuevamente', async () => {
      await verifyThrows(async () => {
        await BallotInstance.start();
      }, /ya ha comenzado/);
    });
    it("no debería permitir agregar votantes", async () => {
      await verifyThrows(async () => {
        await BallotInstance.giveRightToVote(accounts[0]);
      }, /ya ha comenzado/);
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      assert.equal(numVoters, Math.floor(accounts.length / 2), "numVoters no es correcto");
    });
    it("debería informar adecuadamente quienes pueden votar", async () => {
      for (let i in accounts) {
        let canVote = await BallotInstance.canVote(accounts[i]);
        assert.equal(canVote, i % 2, "información sobre el votante incorrecta");
      }
    });
    it("debería rechazar votos de cuentas no registradas", async () => {
      for (let i in accounts) {
        if (i % 2 == 0) {
          await verifyThrows(async () => {
            await BallotInstance.vote(true, { 'from': accounts[i] });
          }, /No tiene derecho/);
        }
      }
    });
    it('debería registrar el voto correctamente', async () => {
      let option = false;
      let votes = { true: 0, false: 0 };
      for (let i in accounts) {
        if (i % 2 == 0) continue;
        let voter = accounts[i];
        option = !option;
        await BallotInstance.vote(option, { 'from': voter });
        votes[option] += 1;
        let votedOption = await BallotInstance.votedFor(voter);
        assert.equal(option, votedOption, "Voto registrado en forma incorrecta");
        let hasVoted = await BallotInstance.hasVoted(voter);
        assert(hasVoted, `No se ha registrado que el votante votó`)
      }
      let yesno = await BallotInstance.result();
      assert.equal(yesno['0'], votes[true], `Los votos por sí son incorrectos`);
      assert.equal(yesno['1'], votes[false], `Los votos por no incorrectos`);
    });
    it('debería rechazar el doble voto', async () => {
      for (let i in accounts) {
        if (i % 2 == 0) continue;
        let voter = accounts[i];
        await verifyThrows(async () => {
          await BallotInstance.vote(true, { 'from': voter });
        }, /ya votó/);
      }
    });
    it('no debería devolver el voto de quienes no han votado', async () => {
      for (let i in accounts) {
        if (i % 2 == 1) continue;
        let voter = accounts[i];
        await verifyThrows(async () => {
          await BallotInstance.votedFor(voter);
        }, /no ha votado/);
      }
    });
    it("debería informar adecuadamente quienes han votado", async () => {
      for (let i in accounts) {
        let hasVoted = await BallotInstance.hasVoted(accounts[i]);
        assert.equal(hasVoted, i % 2, "la información sobre si el votante ya votó es incorrecta");
      }
    });
    it('Solo el organizador puede terminar la votación', async () => {
      await verifyThrows(async () => {
        await BallotInstance.end({ 'from': accounts[1] });
      }, /Solo el organizador/);
    });
    it("debe emitir el evento VotingEnded al terminar", async () => {
      let yesno = await BallotInstance.result();
      let txr = await BallotInstance.end();
      let blockNumber = txr.receipt.blockNumber;
      let eventLog = undefined;
      for (let log of txr.logs) {
        if (log.event == "VotingEnded") {
          eventLog = log;
          break;
        }
      }
      assert(eventLog != undefined, "No se emitió el evento VotingEnded");
      assert.equal(eventLog.args.blockNumber.toNumber(), blockNumber, "Evento con número de bloque incorrecto");
      assert.equal(eventLog.args.yes.toNumber(), yesno.yes, "Evento con número de votos por si incorrecto");
      assert.equal(eventLog.args.no.toNumber(), yesno.no, "Evento con número de votos por no incorrecto");
    });
  });
  describe("Después de finalizar", function () {
    var BallotInstance;
    before(async function () {
      BallotInstance = await newBallot(proposal, chairperson);
      for (let i in accounts) {
        if (i % 2) {
          await BallotInstance.register({ 'from': accounts[i] })
          await BallotInstance.giveRightToVote(accounts[i])
        }
      }
      await BallotInstance.start()
      await BallotInstance.end();
    });
    it('no debería permitir comenzar de nuevo', async () => {
      await verifyThrows(async () => {
        await BallotInstance.start();
      }, /ya ha comenzado/);
    });
    it('no debería permitir terminar de nuevo', async () => {
      await verifyThrows(async () => {
        await BallotInstance.end();
      }, /ya ha terminado/);
    });
    it("no debería permitir agregar votantes", async () => {
      await verifyThrows(async () => {
        await BallotInstance.giveRightToVote(accounts[0]);
      }, /ya ha comenzado|ya ha terminado/);
      let numVoters = (await BallotInstance.numVoters()).toNumber();
      assert.equal(numVoters, Math.floor(accounts.length / 2), "numVoters no es correcto");
    });
    it('no debería permitir votar después de terminar', async () => {
      for (let i in accounts) {
        if (i % 2 == 0) continue;
        await verifyThrows(async () => {
          await BallotInstance.vote(true, { 'from': accounts[i] });
        }, /ya ha terminado/);
      }
    });
  });
});

