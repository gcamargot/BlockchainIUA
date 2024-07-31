import { Button, Modal, Alert } from "react-bootstrap";
import { useState } from "react";
import axios from "axios";
import * as crypto from "crypto-js";
import config from "../config";
import { useMetaMask } from './MetamaskConnect'; // Import MetaMask hook
import { ethers } from "ethers";

interface UploadProposalProps {
  selectedCallId: string;
  modalVisible: boolean;
  setModalVisible: Function;
}

function UploadProposalModal({
  selectedCallId,
  modalVisible,
  setModalVisible,
}: UploadProposalProps) {

  const { signer } = useMetaMask(); // Get signer from MetaMask hook

  const [hash, setHash] = useState("");
  const [variant, setVariant] = useState("success");
  const [heading, setHeading] = useState("Proposal registered");
  const [text, setText] = useState(
    "The proposal has been registered successfully"
  );
  const [alertVisible, setAlertVisible] = useState(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

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
      setVariant("danger");
      setHeading("File not uploaded");
      setText("Please upload a file");
      setAlertVisible(true);
    }
  }

  async function handleCheck() {
    if (!hash) {
      setVariant("danger");
      setHeading("No file uploaded");
      setText("Please upload a file before checking the proposal.");
      setAlertVisible(true);
      return;
    }

    try {
      const response = await axios.get( config.apiUrl + config.endpoints.proposal_data + "0x" + selectedCallId + "/0x" + hash
      );

      if (response.status === 200) {
        setVariant("primary");
        setHeading("Proposal already registered");
        setText("The proposal is already registered.");
        setIsRegistered(true);
      } else {
        setVariant("success");
        setHeading("Proposal not registered");
        setText("The proposal is not registered. You can proceed to register.");
        setIsRegistered(false);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setVariant("success");
        setHeading("Proposal not registered");
        setText("The proposal is not registered. You can proceed to register.");
        setIsRegistered(false);
      } else {
        setVariant("danger");
        setHeading("Error checking proposal");
        setText("An error occurred while checking the proposal.");
      }
    }
    setIsChecked(true);
    setAlertVisible(true);
  }

  async function handleRegister() {
    if (!hash) {
      setVariant("danger");
      setHeading("No file uploaded");
      setText("Please upload a file before registering a proposal.");
      setAlertVisible(true);
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

        setVariant("success");
        setHeading("Proposal registered");
        setText("The proposal has been registered successfully.");
        setIsRegistered(true);
      } catch (error) {
        setVariant("danger");
        setHeading("Proposal not registered");
        setText("An error occurred during registration.");
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
          setVariant("success");
          setHeading("Proposal registered");
          setText("The proposal has been registered successfully.");
          setIsRegistered(true);
        } else {
          setVariant("warning");
          setHeading("Proposal not registered");
          setText("Unexpected response status: " + response.status);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          setVariant("primary");
          setHeading("Proposal not registered");
          setText("The proposal was already registered.");
        } else {
          setVariant("danger");
          setHeading("Proposal not registered");
          setText("An error occurred during registration." + error.response.data.message + error.response.status);
        }
      }
    }
    setAlertVisible(true);
  }

  function handleModalClose() {
    setModalVisible(false);
    setHash("");
    setAlertVisible(false);
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
        <p>Selected Call: {selectedCallId}</p>
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
      {alertVisible && (
        <Alert variant={variant} onClose={() => setAlertVisible(false)} dismissible>
          <Alert.Heading>{heading}</Alert.Heading>
          <p>{text}</p>
        </Alert>
      )}
    </Modal>
  );
}

export default UploadProposalModal;