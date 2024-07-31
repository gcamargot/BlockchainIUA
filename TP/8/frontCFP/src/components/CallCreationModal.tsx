import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { ethers } from 'ethers';
import { useMetaMask } from './MetamaskConnect';
import config from '../config'; // Import the contract configuration
 // Add the import statement at the top of the file
 import Web3 from 'web3';

interface CallCreationModalProps {
  show: boolean;
  onHide: () => void;
  onCreate: (cfp: string, creator: string, closingTime: string) => void;
}

function CallCreationModal({ show, onHide, onCreate }: CallCreationModalProps) {
  const { signer } = useMetaMask();
  const [name, setName] = useState('');
  const [cfp, setCfp] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [closingHour, setClosingHour] = useState('');
  const [closingMinute, setClosingMinute] = useState('');
  const [closingSecond, setClosingSecond] = useState('00');
  const [isValidDate, setIsValidDate] = useState(true);
  const [isValidTime, setIsValidTime] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (show) {
      setCfp(generateRandomHash(64)); // Generate a 256-bit hex string

      // Set default closing date and time
      const now = new Date();
      const defaultClosingDate = now.toISOString().split('T')[0];
      setClosingDate(defaultClosingDate);

      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);
      setClosingHour(tenMinutesFromNow.getHours().toString().padStart(2, '0'));
      setClosingMinute(tenMinutesFromNow.getMinutes().toString().padStart(2, '0'));
    }
  }, [show]);

  useEffect(() => {
    validateDateTime();
  }, [closingDate, closingHour, closingMinute, closingSecond]);

  const validateDateTime = () => {
    const now = new Date();
    const selectedDate = new Date(`${closingDate}T${closingHour.padStart(2, '0')}:${closingMinute.padStart(2, '0')}:${closingSecond.padStart(2, '0')}`);
    setIsValidDate(selectedDate >= now);
    setIsValidTime(closingHour !== '' && closingMinute !== '' && closingSecond !== '');
  };

  const nameHash = (domain: string) => {
    let node =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (domain !== "") {
      const labels = domain.split(".");
      for (let i = labels.length - 1; i >= 0; i--) {
        const labelSha3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(labels[i]));
        node = ethers.utils.keccak256(ethers.utils.concat([node, labelSha3]));
      }
    }
    return node;
  };

  const isUserRegistered = async (name: string, ensRegistryContract: ethers.Contract) => {
    try {
      const node = nameHash(name + ".calls.eth");
      const resolverAddress = await ensRegistryContract.resolver(node);

      return resolverAddress !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
      console.log("Error verifying if the call name is registered: ", error);
      return false;
    }
  };

  const handleCheckAvailability = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }

    if (!name) {
      alert('Please enter a name.');
      return;
    }

    setIsLoading(true);

    try {
      const ensRegistryAddress = config.ENSRegistryContract.address; // Use contract address from config
      const ensRegistryABI = config.ENSRegistryContract.abi; // Use contract ABI from config
      const ensRegistryContract = new ethers.Contract(ensRegistryAddress, ensRegistryABI, signer);

      const isRegistered = await isUserRegistered(name, ensRegistryContract);

      if (isRegistered) {
        alert("The call name is already registered.");
        setIsLoading(false);
        setIsAvailable(false);
        return;
      }

      setIsAvailable(true);
      alert("The call name is available.");
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Error checking availability!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }

    if (!isValidDate || !isValidTime) {
      alert('Please select a valid date and time in the future.');
      return;
    }

    if (!name) {
      alert('Please enter a name.');
      return;
    }

    setIsLoading(true); // Show loading spinner

    try {
      const callId = cfp;
      console.log("Call ID: ", callId);
      const closingTime = new Date(
        `${closingDate}T${closingHour.padStart(2, '0')}:${closingMinute.padStart(2, '0')}:${closingSecond.padStart(2, '0')}`
      );
      const timestamp = Math.floor(closingTime.getTime() / 1000);
      const userAccount = await signer.getAddress();

      // Interact with callFIFSRegistrar contract
      const callFIFSRegistrarAddress = config.CallFIFSRegistrarContract.address; // Use contract address from config
      const callFIFSRegistrarABI = config.CallFIFSRegistrarContract.abi; // Use contract ABI from config
      const callFIFSRegistrarContract = new ethers.Contract(callFIFSRegistrarAddress, callFIFSRegistrarABI, signer);
      
      const publicResolverAddress = config.PublicResolverContract.address; // Use contract address from config
      const publicResolverABI = config.PublicResolverContract.abi; // Use contract ABI from config
      const publicResolverContract = new ethers.Contract(publicResolverAddress, publicResolverABI, signer);

      const ensRegistryAddress = config.ENSRegistryContract.address; // Use contract address from config
      const ensRegistryABI = config.ENSRegistryContract.abi; // Use contract ABI from config
      const ensRegistryContract = new ethers.Contract(ensRegistryAddress, ensRegistryABI, signer);

      const web3 = new Web3(window.ethereum);
      const cfpFactoryContractv2 = new web3.eth.Contract(
        config.CFPFactoryContract.abi,
        config.CFPFactoryContract.address
      );

      const nameWithDomain = `${name}.calls.cfp`;
      
      // Interact with CFPFactory contract
      const cfpFactoryAddress = config.CFPFactoryContract.address; // Use contract address from config
      const cfpFactoryABI = config.CFPFactoryContract.abi; // Use contract ABI from config
      const cfpFactoryContract = new ethers.Contract(cfpFactoryAddress, cfpFactoryABI, signer);

      const callIdHex = ethers.utils.keccak256(callId);

      const createTx = await cfpFactoryContract.create(callIdHex, timestamp);
      
      await createTx.wait();
      

      const cfpCheck = await cfpFactoryContract.calls(callIdHex);

      alert('Call created successfully!');
      onCreate(cfp, '', closingTime.toISOString());

      const node = nameHash(nameWithDomain);

      // Replace the existing code with the fixed code
      const registerTx = await callFIFSRegistrarContract.register(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)), userAccount);
      await registerTx.wait();
      console.log("Register receipt: ", registerTx);
      
      console.log("CFP Check: ", cfpCheck);
      const setAddrTx = await publicResolverContract.setAddr(node, cfpCheck[1]);
      await setAddrTx.wait();
      console.log("Set Addr receipt: ", setAddrTx);

      const setResolverTx = await ensRegistryContract.setResolver(node, publicResolverAddress);
      await setResolverTx.wait();
      console.log("Set Resolver receipt: ", setResolverTx);
      
      console.log("Le seteamos el callIdHex: " + callIdHex + " al el nombre: " + name)
      //const setNameTx = await cfpFactoryContract.setName(callIdHex, name);
      //await setNameTx.wait();
      const setNameTx = await cfpFactoryContractv2.methods
				.setName(callIdHex, name)
				.send({ from: userAccount, gas: 6721975, gasPrice: 20000000000 });
			
      console.log("Set Name receipt: ", setNameTx);

      const resolvedAddress = await publicResolverContract.addr(node);
      console.log("Node:" + node)
      if (resolvedAddress.toLowerCase() === cfpCheck.cfp.toLowerCase()) {
        alert(`Call name ${name}.calls.eth has been successfully registered.`);
      } else {
        alert(`Resolved address ${resolvedAddress} does not match user address ${userAccount}.`);
      }
      onHide(); // Close the modal immediately after signing the transaction
      
    } catch (error) {
      console.error('Error during call creation:', error);
      if (error instanceof Error) {
        if (error.message.includes('CALL_EXCEPTION')) {
          alert(`Permission error: ${error.message}`);
        } else if (error.message.includes('4001')) {
          alert('User cancelled the signature request.');
        } else {
          alert(`Unknown error: ${error.message}`);
        }
      } else {
        alert('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false); // Hide loading spinner
      onHide(); // Close the modal
    }
  };
  const generateRandomHash = (length: number) => {
    if (length % 2 !== 0) {
      throw new Error(
        "Length must be an even number to generate a valid hex string."
      );
    }
  
    const byteLength = length / 2; // Cada byte se convierte en dos caracteres hexadecimales
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    let hexString = "";
    for (let i = 0; i < array.length; i++) {
      hexString += array[i].toString(16).padStart(2, "0");
    }
    return "0x" + hexString;
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Create a New Call</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              disabled={isLoading}
            />
          </Form.Group>
          <Form.Group controlId="formCfp">
            <Form.Label>CFP</Form.Label>
            <Form.Control
              type="text"
              value={cfp}
              readOnly
              disabled
            />
          </Form.Group>
          <Form.Group controlId="formClosingDate">
            <Form.Label>Closing Date</Form.Label>
            <Form.Control
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Set the minimum date to today
            />
          </Form.Group>
          <Form.Group controlId="formClosingHour">
            <Form.Label>Closing Hour</Form.Label>
            <Form.Control
              type="number"
              placeholder="HH"
              min="0"
              max="23"
              value={closingHour}
              onChange={(e) => setClosingHour(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="formClosingMinute">
            <Form.Label>Closing Minute</Form.Label>
            <Form.Control
              type="number"
              placeholder="MM"
              min="0"
              max="59"
              value={closingMinute}
              onChange={(e) => setClosingMinute(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="formClosingSecond">
            <Form.Label>Closing Second</Form.Label>
            <Form.Control
              type="number"
              placeholder="SS"
              min="0"
              max="59"
              value={closingSecond}
              onChange={(e) => setClosingSecond(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
    <Button variant="secondary" onClick={onHide} disabled={isLoading}>
      Cancel
    </Button>
    <Button variant="primary" onClick={isAvailable ? handleCreate : handleCheckAvailability} disabled={!isValidDate || !isValidTime || isLoading}>
      {isLoading ? <Spinner animation="border" size="sm" /> : isAvailable ? 'Create' : 'Check Availability'}
    </Button>
  </Modal.Footer>
</Modal>
);
}

export default CallCreationModal;