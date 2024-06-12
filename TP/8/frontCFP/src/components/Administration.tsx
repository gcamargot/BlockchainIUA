import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from './MetamaskConnect';
import config from '../config'; // Ensure correct path to config
import axios from 'axios'; // Assuming axios is used to fetch pending users
import { Container, Table, Button } from 'react-bootstrap';

function Administration() {
  const { provider, signer } = useMetaMask();
  const contractAddress = config.contract.address;
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [pendingUsers, setPendingUsers] = useState<string[]>([]);

  // Initialize contract when signer is available
  useEffect(() => {
    if (signer) {
      const contractInstance = new ethers.Contract(contractAddress, config.contract.abi, signer);
      setContract(contractInstance);
    }
  }, [signer]);

  // Fetch pending users from API on component mount
  useEffect(() => {
    axios.get(config.apiUrl + config.endpoints.pending)
      .then(response => {
        setPendingUsers(response.data['pending']);
      })
      .catch(error => {
        console.error('Error fetching pending users:', error);
      });
  }, []);

  // Function to authorize an address
  const authorizeAddress = async (address: string) => {
    if (!contract) {
      alert('Contract not initialized');
      return;
    }

    try {
      const tx = await contract.authorize(address);
      await tx.wait();
      alert('Address authorized successfully');
      // Remove the address from pendingUsers
      setPendingUsers(pendingUsers.filter(user => user !== address));
    } catch (error) {
      console.error('Error authorizing address:', error);
      alert('Error authorizing address');
    }
  };


  return (
    <Container className="my-4">
      <h2>Administration Panel</h2>
      <h3>Pending Users</h3>
      {pendingUsers.length === 0 ? (
        <p className="text-muted">There are 0 users that requested authorization.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Index</th>
              <th>Address</th>
              <th>Authorize</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{user}</td>
                <td>
                  <Button variant="success" onClick={() => authorizeAddress(user)}>Authorize</Button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default Administration;