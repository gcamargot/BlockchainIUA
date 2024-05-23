import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import Navbar from "./components/Navbar";
import { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import * as crypto from "crypto-js";
import AlertCFP from "./components/Alert";


function App() {
  const [contractAddress, setContractAddress] = useState("");
  const [owner, setOwner] = useState("");
  const [proposals, setProposals] = useState([]);
  const [selectedCallId, setSelectedCalllId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [hash, setHash] = useState("");
  const [variant, setVariant] = useState("success");
  const [heading, setHeading] = useState("Proposal registered");
  const [text, setText] = useState("The proposal has been registered successfully");
  const [alertVisible, setAlertVisible] = useState(false);


  const handleCallClick = (call: any) => {
    console.log("Proposal clicked:", call);
    setSelectedCalllId(call);
    setModalVisible(true);
  };

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/contract-address", {
        headers: { "Access-Control-Allow-Origin": "*" },
      })
      .then((response) => {
        setContractAddress(response.data.address);
      })
      .catch((error) => {
        console.error("Error fetching contract address:", error);
      });
    axios
      .get("http://127.0.0.1:5000/contract-owner", {
        headers: { "Access-Control-Allow-Origin": "*" },
      })
      .then((response) => {
        setOwner(response.data.address);
      })
      .catch((error) => {
        console.error("Error fetching owner:", error);
      });
    axios
      .get("http://127.0.0.1:5000/proposals", {
        headers: { "Access-Control-Allow-Origin": "*" },
      })
      .then((response) => {
        setProposals(response.data.proposals);
      })
      .catch((error) => {
        console.error("Error fetching pending:", error);
      });
  }, []);

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
    
    try{
      axios
        .get("http://127.0.0.1:5000/proposal-data/0x" + selectedCallId+ "/0x" + hash ,{})
        .then((response) => {
          console.log(response.status)
          if(response.status === 200){
            setVariant("primary");
            setHeading("Proposal registered");
            setText("The proposal is registered");
        }
        
        })
        .catch((error) => {
          if(error.response.status === 404){
            setVariant("primary");
            setHeading("Proposal not registered");
            setText("The proposal is not registered");
          }
          else{
            setVariant("danger");
            setHeading(error.response.status);
            setText("The proposal is not valid");
          }})
      }catch(error){
        console.error("Error registering proposal:", error);
      }
      setAlertVisible(true);
    
  }

  function handleRegister() {

    try{
    axios
      .post("http://127.0.0.1:5000/register-proposal", { "callId": "0x" + selectedCallId, "proposal": "0x" + hash })
      .then((response) => {
        setVariant(response.status === 201 ? "success" : "danger");
        setHeading("Proposal"+ (response.status === 201 ? " " : " not " )+ "registered");
        setText("The proposal has been registered successfully");
      })
      .catch((error) => {
        if(error.response.status === 403){
          setVariant("danger");
          setHeading("Proposal not registered");
          setText("The proposal was already registered");
        }} );
    }catch(error){
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
    <div className="App">
      <Navbar />
      <p>Contract address: {contractAddress}</p>
      <p>Owner address: {owner}</p>
      <div>
        <h1>List of calls:</h1>
        <ul>
          {proposals.map((proposal) => (
            <li
              key={proposal}
              onClick={() => handleCallClick(proposal)}
            >
              {"0x" + proposal}
            </li>
          ))}
        </ul>
        <Modal
        show={modalVisible}
        onHide={handleModalClose}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{"Upload a file to check"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
          <Button variant="primary" onClick={handleRegistered}>Check if proposal is registered</Button>
        </Modal.Footer>
        {alertVisible && <AlertCFP variant={variant} heading={heading} text={text} />}
      </Modal>
      </div>
    </div>
  );
}

export default App;
