import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import UploadProposalModal from './UploadProposalModal';
import CallCreationModal from './CallCreationModal'; // Import the new component
import config from '../config';
import { useMetaMask } from './MetamaskConnect';
import { ethers } from 'ethers';

interface Call {
  callId: string;
  cfp: string;
  creator: string;
  closingTime: string;
}

function CallsTable() {
  const { userAccount, setUserAccount, signer, connectMetaMask } = useMetaMask();
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [modalUploadVisible, setUploadModalVisible] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [creationModalVisible, setCreationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    axios
      .get(config.apiUrl + config.endpoints.calls)
      .then((response): void => {
        setCalls(response.data.callsList);
      })
      .catch((error) => {
        console.error('Error fetching calls:', error);
      });
  }, [creationModalVisible]);

  const checkAuthorization = async (account: string) => {
    try {
      const response = await axios.get(`${config.apiUrl}${config.endpoints.authorized}/${account}`);
      setIsAuthorized(response.data["authorized"]);
    } catch (error) {
      console.error('Error checking authorization status:', error);
      setIsAuthorized(false);
    }
  };

  const checkRegistration = async (account: string) => {
    try {
      const response = await axios.get(`${config.apiUrl}${config.endpoints.registered}/${account}`);
      setIsRegistered(response.data["registered"]);
    } catch (error) {
      console.error('Error checking registration status:', error);
      setIsRegistered(false);
    }
  };

  const handleCallClick = (call: Call) => {
    setSelectedCallId(call.callId);
    setUploadModalVisible(true);
  };

  const handleRegister = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }

    try {
      const contractAddress = config.contract.address;
      const contractABI = config.contract.abi;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.register();
      await tx.wait();

      alert('Registration successful!');
      setIsRegistered(true);
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Registration failed!');
    }
  };

  const handleMetaMaskLogin = async () => {
    try {
      await connectMetaMask();
      if (userAccount) {
        await checkAuthorization(userAccount);
        await checkRegistration(userAccount);
      }
    } catch (error) {
      console.error('MetaMask connection failed:', error);
    }
  };

  useEffect(() => {
    if (userAccount) {
      checkAuthorization(userAccount);
      checkRegistration(userAccount);
    }
  }, [userAccount]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAccount(accounts[0]);
          await checkAuthorization(accounts[0]);
          await checkRegistration(accounts[0]);

          if (!isRegistered) {
            // Prompt user to log in again if the account is not registered
            handleMetaMaskLogin();
          }
        } else {
          setUserAccount('');
        }
      };

      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);

      // Clean up the event listener when the component unmounts
      return () => {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isRegistered]);

  const handleCreateCall = (cfp: string, creator: string, closingTime: string) => {
    // Add logic to create a new call, e.g., make an API request or interact with a smart contract
    console.log('Creating call:', { cfp, creator, closingTime });
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh', paddingTop: '20px' }}>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>CFP</th>
            <th>Creator</th>
            <th>Deadline</th>
            <th>Register Proposal</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call, index) => (
            <tr key={index}>
              <td>{call.cfp}</td>
              <td>{call.creator}</td>
              <td>{call.closingTime}</td>
              <td>
                <Button variant="primary" onClick={() => handleCallClick(call)}>Register Proposal</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <UploadProposalModal
        selectedCallId={selectedCallId}
        modalVisible={modalUploadVisible}
        setModalVisible={setUploadModalVisible}
      />
      <div style={{ marginTop: '20px' }}>
        {!userAccount ? (
          <Button variant="primary" onClick={handleMetaMaskLogin}>Connect MetaMask to Create Calls</Button>
        ) : isAuthorized ? (
          <Button variant="success" onClick={() => setCreationModalVisible(true)}>Create your Call</Button>
        ) : isRegistered ? (
          <span >Your registration is pending approval</span>
        ) : (
          <Button variant="warning" onClick={handleRegister}>Register to create your call</Button>
        )}
      </div>
      <CallCreationModal
        show={creationModalVisible}
        onHide={() => setCreationModalVisible(false)}
        onCreate={handleCreateCall}
      />
    </div>
  );
}

export default CallsTable;