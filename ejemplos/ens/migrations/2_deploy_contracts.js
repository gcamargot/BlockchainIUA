const ENSRegistry = artifacts.require("./ENSRegistry.sol");
const FIFSRegistrar = artifacts.require("./FIFSRegistrar.sol");
const ReverseRegistrar = artifacts.require("./ReverseRegistrar.sol");
const PublicResolver = artifacts.require("./PublicResolver.sol");

const web3 = new (require("web3"))();
const namehash = require("eth-ens-namehash");
const keccak256 = web3.utils.keccak256;


module.exports = async function(deployer, network, accounts) {
	var tld = "iua";
	// Primero desplegamos el registro (registry)
	await deployer.deploy(ENSRegistry);
	let ens = await ENSRegistry.at(ENSRegistry.address);
	// Conviene desplegar un resolutor público
	await deployer.deploy(PublicResolver,ENSRegistry.address);
	let publicResolver = await PublicResolver.at(PublicResolver.address);
	// Para facilitar su uso, le damos un nombre
	await ens.setSubnodeOwner("0x0", keccak256("resolver"), accounts[0]);
	// Declaramos el resolver de este nuevo dominio de primer nivel
	await ens.setResolver(namehash.hash("resolver"), PublicResolver.address);
	// Registramos en el resolver su propia dirección asociada al nuevo dominio
	await publicResolver.setAddr(namehash.hash("resolver"), PublicResolver.address);
	// Desplegamos un registrador para el dominio `tld`
	await deployer.deploy(FIFSRegistrar, ENSRegistry.address, namehash.hash(tld));
	// Transferimos la propiedad del dominio `tld` al nuevo registrador
	await ens.setSubnodeOwner("0x0", keccak256(tld), FIFSRegistrar.address);
	// Desplegamos el registrador reverso
	await deployer.deploy(ReverseRegistrar, ENSRegistry.address, PublicResolver.address);
	// Transferimos la propiedad del dominio "addr.reverse" al registrador
	await ens.setSubnodeOwner("0x0", keccak256("reverse"), accounts[0]);
	await ens.setSubnodeOwner(namehash.hash("reverse"), keccak256("addr"), ReverseRegistrar.address);
};
