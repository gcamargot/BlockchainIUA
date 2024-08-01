import { Button, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import * as crypto from "crypto-js";
import config from "../config";
import { useMetaMask } from './MetamaskConnect'; // Import MetaMask hook
import { ethers } from "ethers";

interface UploadProposalProps {
  selectedCallId: string;
  selectedCFP: string;
  modalVisible: boolean;
  setModalVisible: Function;
}

function UploadProposalModal({
  selectedCallId,
  selectedCFP,
  modalVisible,
  setModalVisible,
}: UploadProposalProps) {

  const { signer } = useMetaMask(); // Get signer from MetaMask hook
  const [hash, setHash] = useState("");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [cfpName, setCfpName] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCFP) {
      resolveCfpName(selectedCFP);
    }
  }, [selectedCFP]);

  const resolveCfpName = async (address: string) => {
    if (!signer) return;

    try {
      const reverseNode = ethers.utils.namehash(`${address.slice(2)}.addr.reverse`);
      const contractAddress = config.PublicResolverContract?.address;
      const contractABI = config.PublicResolverContract?.abi;

      if (!contractAddress || !contractABI) {
        console.error("PublicResolver contract address or ABI is missing in the config.");
        return;
      }

      const publicResolver = new ethers.Contract(contractAddress, contractABI, signer);
      const name = await publicResolver.name(reverseNode);
      setCfpName(name || null);
    } catch (error) {
      console.error('Error resolving CFP name:', error);
      setCfpName(null);
    }
  };

  function handleUpload(e?: File) {
    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      const fileData = fileReader.result;
      if (fileData) {
        const fileHash = crypto.SHA256(fileData.toString());
        setHash(fileHash.toString());
        setIsChecked(false);
      }
    };
    if (e) {
      fileReader.readAsBinaryString(e);
    } else {
      window.alert("Please upload a file");
    }
  }

  async function handleCheck() {
    if (!hash) {
      window.alert("Please upload a file before checking the proposal.");
      return;
    }
  
    try {
      const response = await axios.get(config.apiUrl + config.endpoints.proposal_data + "0x" + selectedCallId + "/0x" + hash);
  
      if (response.status === 200) {
        window.alert("The proposal is already registered.");
        setIsRegistered(true);
      } else {
        window.alert("The proposal is not registered. You can proceed to register.");
        setIsRegistered(false);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Do not log the 404 error to the console
        window.alert("The proposal is not registered. You can proceed to register.");
        setIsRegistered(false);
      } else {
        // Log other errors
        console.error("An error occurred while checking the proposal.", error);
        window.alert("An error occurred while checking the proposal.");
      }
    }
    setIsChecked(true);
  }

  async function handleRegister() {
    if (!hash) {
      window.alert("Please upload a file before registering a proposal.");
      return;
    }

    if (signer) {
      // Interact directly with the smart contract
      try {
        const contractAddress = config.CFPFactoryContract.address;
        const contractABI = config.CFPFactoryContract.abi;
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        const tx = await contract.registerProposal("0x" + selectedCallId, "0x" + hash);
        await tx.wait();

        window.alert("The proposal has been registered successfully.");
        setIsRegistered(true);
        handleModalClose();
      } catch (error) {
        window.alert("An error occurred during registration.");
      }
    } else {
      // Fallback to API if no signer is available
      alert("You are not connected to Metamask. Your proposal will be registered anonymously.")
      try {
        const response = await axios.post(config.apiUrl + config.endpoints.register_proposal, {
          callId: `0x${selectedCallId}`,
          proposal: `0x${hash}`,
        });

        if (response.status === 201) {
          window.alert("The proposal has been registered successfully.");
          setIsRegistered(true);
          handleModalClose();
        } else {
          window.alert("Unexpected response status: " + response.status);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          window.alert("The proposal was already registered.");
        } else {
          window.alert("An error occurred during registration." + error.response.data.message + error.response.status);
        }
      }
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      window.alert('Address copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy address:', error);
    });
  };

  const renderTooltip = (props: any, address: string) => (
    <Tooltip id="button-tooltip" {...props}>
      {address}
    </Tooltip>
  );

  function handleModalClose() {
    setModalVisible(false);
    setHash("");
    setIsChecked(false);
    setIsRegistered(false);
  }

  return (
    <Modal
      show={modalVisible}
      onHide={handleModalClose}
      backdrop="static"
      keyboard={false}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>{"Upload a proposal file"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Selected CFP: 
          {cfpName ? (
            <OverlayTrigger
              placement="top"
              overlay={renderTooltip({}, selectedCFP)}
            >
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px' }}
                onClick={() => handleCopyToClipboard(selectedCFP)}
              >
                {cfpName}
              </span>
            </OverlayTrigger>
          ) : (
            <span>{selectedCFP}</span>
          )}
        </p>
        <input
          type="file"
          onChange={(e) => {
            handleUpload(e.target.files![0]);
          }}
        />
        {hash && <p>Hash: {"0x" + hash}</p>}
      </Modal.Body>
      <Modal.Footer>
        {!isChecked && (
          <Button variant="primary" onClick={handleCheck}>
            Check Proposal
          </Button>
        )}
        {isChecked && !isRegistered && (
          <Button variant="primary" onClick={handleRegister}>
            Register Proposal
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default UploadProposalModal;