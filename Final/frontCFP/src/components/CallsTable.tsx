import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import UploadProposalModal from './UploadProposalModal';
import CallCreationModal from './CallCreationModal'; // Import the new component
import config from '../config';
import { useMetaMask } from './MetamaskConnect';
import { ethers } from 'ethers';
import Web3 from 'web3';
import { Toast, ToastContainer } from 'react-bootstrap';

interface Call {
  callId: string;
  cfp: string;
  creator: string;
  closingTime: string;
}

function CallsTable() {
  const { userAccount, setUserAccount, signer, connectMetaMask } = useMetaMask();
  const [calls, setCalls] = useState<Call[]>([]);
  const [creatorNames, setCreatorNames] = useState<{ [key: string]: string | null }>({});
  const [callNames, setCallNames] = useState<{ [key: string]: string | null }>({});
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [selectedCFP, setSelectedCFP] = useState<string>('');
  const [modalUploadVisible, setUploadModalVisible] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [creationModalVisible, setCreationModalVisible] = useState<boolean>(false);
  const [showExpired, setShowExpired] = useState<boolean>(false); // New state for toggle
  const [showCopiedToast, setShowCopiedToast] = useState(false); // State to control the toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message

  useEffect(() => {
    axios
      .get(config.apiUrl + config.endpoints.calls)
      .then((response): void => {
        const currentDateTime = new Date();
        const filteredCalls = response.data.callsList.filter((call: Call) => {
          const callDeadline = new Date(call.closingTime);
          return showExpired || callDeadline > currentDateTime; // Filter based on showExpired state
        });
        setCalls(filteredCalls);
        filteredCalls.forEach((call: Call) => {
          resolveCreators(call.creator);
          resolveCalls(call.cfp);
        });
      })
      .catch((error) => {
        console.error('Error fetching calls:', error);
      });
  }, [creationModalVisible, showExpired]); // Add showExpired as a dependency

  const nameHash = (domain: string) => {
    let node =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
    domain.toString();
    if (domain !== "") {
        const labels = domain.split(".");

        for (let i = labels.length - 1; i >= 0; i--) {
            const labelSha3 = Web3.utils.sha3(labels[i]);
            if (labelSha3) {
              const concatenatedString = node + labelSha3.slice(2);
              node = Web3.utils.sha3(concatenatedString) as string;
            }
        }
    }

    return node;
  };

  const resolveCalls = async (address: string) => {
    if (!signer) return;

    try {
      const reverseNode = nameHash(`${address.toLowerCase().substring(2)}.addr.reverse`);
      const contractAddress = config.PublicResolverContract?.address;
      const contractABI = config.PublicResolverContract?.abi;

      if (!contractAddress || !contractABI) {
        console.error("PublicResolver contract address or ABI is missing in the config.");
        return;
      }

      const publicResolver = new ethers.Contract(contractAddress, contractABI, signer);
      const name = await publicResolver.name(reverseNode);
      setCallNames(prevNames => ({
        ...prevNames,
        [address]: name || null,
      }));
    } catch (error) {
      console.error('Error resolving ENS Calls:', error);
      setCallNames(prevNames => ({
        ...prevNames,
        [address]: null,
      }));
    }
  };

  const resolveCreators = async (address: string) => {
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

      setCreatorNames(prevNames => ({
        ...prevNames,
        [address]: name || null,
      }));
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      setCreatorNames(prevNames => ({
        ...prevNames,
        [address]: null,
      }));
    }
  };

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
    setSelectedCFP(call.cfp);
    setUploadModalVisible(true);
  };

  const handleRegister = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }

    try {
      const contractAddress = config.CFPFactoryContract.address;
      const contractABI = config.CFPFactoryContract.abi;
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage('Address copied to clipboard!');
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000); // Hide after 2 seconds
    }).catch((error) => {
      console.error('Failed to copy address:', error);
    });
  };

  const renderTooltip = (props: any, address: string) => (
    <Tooltip id="button-tooltip" {...props}>
      {address}
    </Tooltip>
  );
  return (
    <div className="d-flex flex-column align-items-center" style={{ minHeight: '100vh', paddingTop: '10px' }}> {/* Content aligned to the top */}
      <div className="mb-3">
        <Form.Check 
          type="switch"
          id="show-expired-switch"
          label="Show expired"
          checked={showExpired}
          onChange={() => setShowExpired(!showExpired)} // Toggle the showExpired state
        />
      </div>
      <div style={{ flex: 1, width: '100%', maxWidth: '1200px', overflowY: 'auto', marginBottom: '60px' }}> {/* Flex and marginBottom added */}
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th style={{ width: '250px' }}>CFP</th>
              <th style={{ width: '250px' }}>Creator</th>
              <th style={{ width: '150px' }}>Deadline</th>
              <th style={{ width: '200px' }}>Register Proposal</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call, index) => {
              const isExpired = new Date(call.closingTime) < new Date();
              return (
                <tr key={index}>
                  <td style={{ width: '250px' }}>
                    <OverlayTrigger
                      placement="top"
                      overlay={(props) => renderTooltip(props, call.cfp)}
                    >
                      <span onClick={() => handleCopyToClipboard(call.cfp)}>
                        {callNames[call.cfp] && callNames[call.cfp] + ".calls.eth" || call.cfp}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td style={{ width: '250px' }}>
                    <OverlayTrigger
                      placement="top"
                      overlay={(props) => renderTooltip(props, call.creator)}
                    >
                      <span onClick={() => handleCopyToClipboard(call.creator)}>
                        {creatorNames[call.creator] && creatorNames[call.creator] + ".users.eth" || call.creator}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td style={{ width: '150px' }}>{call.closingTime}</td>
                  <td style={{ width: '200px' }}>
                    <Button 
                      variant={isExpired ? "secondary" : "primary"}
                      onClick={() => handleCallClick(call)} 
                      disabled={isExpired} // Disable if the call is expired
                    >
                      Register Proposal
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <UploadProposalModal
        selectedCallId={selectedCallId}
        selectedCFP={selectedCFP}
        modalVisible={modalUploadVisible}
        setModalVisible={setUploadModalVisible}
      />
      <div style={{ position: 'fixed', bottom: '20px', width: '100%', textAlign: 'center' }}> {/* Button at the bottom of the screen */}
        {!userAccount ? (
          <Button variant="primary" onClick={handleMetaMaskLogin}>Connect MetaMask to Create Calls</Button>
        ) : isAuthorized ? (
          <Button variant="success" onClick={() => setCreationModalVisible(true)}>Create your Call</Button>
        ) : isRegistered ? (
          <span>Your registration is pending approval</span>
        ) : (
          <Button variant="warning" onClick={handleRegister}>Register to create your call</Button>
        )}
      </div>
      <CallCreationModal
        show={creationModalVisible}
        onHide={() => setCreationModalVisible(false)}
        onCreate={handleCreateCall}
      />
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showCopiedToast} onClose={() => setShowCopiedToast(false)} delay={2000} autohide>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
);
}
export default CallsTable;