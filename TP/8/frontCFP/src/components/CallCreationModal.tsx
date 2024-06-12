import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ethers } from 'ethers';
import { useMetaMask } from './MetamaskConnect';
import config from '../config'; // Import the contract configuration

interface CallCreationModalProps {
  show: boolean;
  onHide: () => void;
  onCreate: (cfp: string, creator: string, closingTime: string) => void;
}

function CallCreationModal({ show, onHide, onCreate }: CallCreationModalProps) {
  const { signer } = useMetaMask();
  const [cfp, setCfp] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [closingHour, setClosingHour] = useState('');
  const [closingMinute, setClosingMinute] = useState('');
  const [closingSecond, setClosingSecond] = useState('');
  const [isValidDate, setIsValidDate] = useState(true);
  const [isValidTime, setIsValidTime] = useState(true);

  useEffect(() => {
    if (show) {
      const randomHex = ethers.utils.hexlify(ethers.utils.randomBytes(32)).substring(2); // Generate a 256-bit hex string
      setCfp(randomHex);
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

  const handleCreate = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }

    if (!isValidDate || !isValidTime) {
      alert('Please select a valid date and time in the future.');
      return;
    }

    try {
      const contractAddress = config.contract.address; // Use contract address from config
      const contractABI = config.contract.abi; // Use contract ABI from config
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const callId = '0x' + cfp;
      const closingTime = new Date(
        `${closingDate}T${closingHour.padStart(2, '0')}:${closingMinute.padStart(2, '0')}:${closingSecond.padStart(2, '0')}`
      );
      const timestamp = Math.floor(closingTime.getTime() / 1000);

      const tx = await contract.create(callId, timestamp);
      await tx.wait();

      alert('Call created successfully!');
      onCreate(cfp, '', closingTime.toISOString());
      onHide();
    } catch (error) {
      console.error('Error during call creation:', error);
      alert('Call creation failed!');
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Create a New Call</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formCfp">
            <Form.Label>CFP</Form.Label>
            <Form.Control
              type="text"
              value={cfp}
              readOnly
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
        {(!isValidDate || !isValidTime) && (
          <div className="text-danger">
            Please select a valid date and time in the future.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={!isValidDate || !isValidTime}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CallCreationModal;