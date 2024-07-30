// src/config.ts
import CFPFactory from "../../../6/build/contracts/CFPFactory.json";

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
    contract: {
      address : CFPFactory.networks[5777].address, // Replace with the actual contract address
      abi: CFPFactory.abi,
    },
  };
  
  export default config;
  