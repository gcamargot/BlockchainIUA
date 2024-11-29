// src/config.ts
import CFPFactory from "../../../6/build/contracts/CFPFactory.json";
import PublicResolver from "../../../6/build/contracts/PublicResolver.json";
import UserFIFSRegistrar from "../../../6/build/contracts/UserFIFSRegistrar.json";
import ENSRegistry from "../../../6/build/contracts/ENSRegistry.json";
import ReverseRegistrar from "../../../6/build/contracts/ReverseRegistrar.json";
import CallFIFSRegistrar from "../../../6/build/contracts/CallFIFSRegistrar.json";

const config = {
    apiUrl: "http://127.0.0.1:5000/",  // Base API URL
    endpoints: {
      contractOwner: "contract-owner",
      pending: "pending",
      authorize: "authorize/",
      authorized: "authorized/",
      registered: "registered/",
      calls: "calls",
      createdBy: "createdBy/",
      creators: "creators",
      proposal_data: "proposal-data/",
      register_proposal: "register-proposal",
    },
    CFPFactoryContract: {
      address : CFPFactory.networks[5777].address, // Replace with the actual contract address
      abi: CFPFactory.abi,
    },

    PublicResolverContract: {
      address: PublicResolver.networks[5777].address, // Replace with the actual contract address
      abi: PublicResolver.abi,
    },
    UserFIFSRegistrarContract: {
      address: UserFIFSRegistrar.networks[5777].address, // Replace with the actual contract address
      abi: UserFIFSRegistrar.abi,
    },
    ENSRegistryContract: {
      address: ENSRegistry.networks[5777].address, // Replace with the actual contract address
      abi: ENSRegistry.abi,
    },
    ReverseRegistryContract: {
      address: ReverseRegistrar.networks[5777].address, // Replace with the actual contract address
      abi: ReverseRegistrar.abi,
    },
    CallFIFSRegistrarContract: {
      address: CallFIFSRegistrar.networks[5777].address, // Replace with the actual contract address
      abi: CallFIFSRegistrar.abi,
    },

  };
  
  export default config;
  