import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from './MetamaskConnect';
import config from '../config'; // Ensure correct path to config
import axios from 'axios'; // Assuming axios is used to fetch pending users
import { Container, Table, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

function Administration() {
  const { provider, signer } = useMetaMask();
  const contractAddress = config.CFPFactoryContract.address;
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [resolvedNames, setResolvedNames] = useState<{ [key: string]: string | null }>({});

  // Initialize contract when signer is available
  useEffect(() => {
    if (signer) {
      const contractInstance = new ethers.Contract(contractAddress, config.CFPFactoryContract.abi, signer);
      setContract(contractInstance);
    }
  }, [signer]);

  // Fetch pending users from API on component mount
  useEffect(() => {
    axios.get(config.apiUrl + config.endpoints.pending)
      .then(response => {
        const users: string[] = response.data['pending'];
        setPendingUsers(users);
        users.forEach(user => resolveENSName(user));
      })
      .catch(error => {
        console.error('Error fetching pending users:', error);
      });
  }, []);

  // Resolve ENS name for an address
  const resolveENSName = async (address: string) => {
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

      setResolvedNames(prevNames => ({
        ...prevNames,
        [address]: name || null,
      }));
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      setResolvedNames(prevNames => ({
        ...prevNames,
        [address]: null,
      }));
    }
  };

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

  // Function to handle copying the address to the clipboard
  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
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
              <th>Address / ENS Name</th>
              <th>Authorize</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id={`tooltip-${index}`}>{user}</Tooltip>}
                  >
                    <span
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleCopyAddress(user)}
                    >
                      {resolvedNames[user] || user}
                    </span>
                  </OverlayTrigger>
                </td>
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