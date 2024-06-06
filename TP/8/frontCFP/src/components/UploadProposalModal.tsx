import { Button, Modal } from "react-bootstrap";
import AlertCFP from "./Alert";
import { useState } from "react";
import axios from "axios";
import * as crypto from "crypto-js";

const apiUrl = "http://127.0.0.1:5000";

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
  const checkProposalEndPoint = "/proposal-data";
  const registerEndPoint = "/register-proposal";
  const [hash, setHash] = useState("");
  const [variant, setVariant] = useState("success");
  const [heading, setHeading] = useState("Proposal registered");
  const [text, setText] = useState(
    "The proposal has been registered successfully"
  );
  const [alertVisible, setAlertVisible] = useState(false);

  function handleUpload(e?: File) {
    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      const fileData = fileReader.result;
      if (fileData) {
        const fileHash = crypto.SHA256(fileData.toString());
        setHash(fileHash.toString());
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

  function handleRegistered() {
    try {
      axios
        .get(
          apiUrl +
            checkProposalEndPoint +
            "/0x" +
            selectedCallId +
            "/0x" +
            hash,
          {}
        )
        .then((response) => {
          console.log(response.status);
          if (response.status === 200) {
            setVariant("primary");
            setHeading("Proposal registered");
            setText("The proposal is registered");
          }
        })
        .catch((error) => {
          if (error.response.status === 404) {
            setVariant("primary");
            setHeading("Proposal not registered");
            setText("The proposal is not registered");
          } else {
            setVariant("danger");
            setHeading(error.response.status);
            setText("The proposal is not valid");
          }
        });
    } catch (error) {
      console.error("Error registering proposal:", error);
    }
    setAlertVisible(true);
  }
  function handleRegister() {
    try {
      axios
        .post(apiUrl + registerEndPoint, {
          callId: "0x" + selectedCallId,
          proposal: "0x" + hash,
        })
        .then((response) => {
          setVariant(response.status === 201 ? "success" : "danger");
          setHeading(
            "Proposal" +
              (response.status === 201 ? " " : " not ") +
              "registered"
          );
          setText("The proposal has been registered successfully");
        })
        .catch((error) => {
          if (error.response.status === 403) {
            setVariant("danger");
            setHeading("Proposal not registered");
            setText("The proposal was already registered");
          }
        });
    } catch (error) {
      setVariant("danger");
      setHeading("Proposal not registered");
      setText("The proposal is not valid");
    }
    setAlertVisible(true);
  }

  function handleModalClose() {
    setModalVisible(false);
    setHash("");
    setAlertVisible(false);
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
        <Button variant="secondary" onClick={handleRegister}>
          Register Proposal
        </Button>
        <Button variant="primary" onClick={handleRegistered}>
          Check if proposal is registered
        </Button>
      </Modal.Footer>
      {alertVisible && (
        <AlertCFP variant={variant} heading={heading} text={text} />
      )}
    </Modal>
  );
}

export default UploadProposalModal;
