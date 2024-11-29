import { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import metamaskLogo from '../assets/metamask-logo.png';
import NameRegisterModal from './NameRegisterModal';
import { useMetaMask } from './MetamaskConnect';
import { ethers } from 'ethers';
import config from '../config';
import { Toast, ToastContainer } from 'react-bootstrap';

interface NavbarProps {
  setSelectedTab: (tab: number) => void;
  factoryOwner: string;
}

function NavbarMenu({ setSelectedTab, factoryOwner }: NavbarProps) {
  const { signer, userAccount, connectMetaMask } = useMetaMask();
  const [nameRegisterModalVisible, setNameRegisterModalVisible] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false); // State for toast

  useEffect(() => {
    if (userAccount) {
      resolveENSName(userAccount);
    }
  }, [userAccount]);

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
      console.log("Resolved name:", name);

      if (name) {
        setResolvedName(name);
      } else {
        setResolvedName(null);
      }
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      setResolvedName(null);
    }
  };

  const handleSelectedTab = (tab: number) => () => {
    setSelectedTab(tab);
  };

  const handleRegisterClick = () => {
    setNameRegisterModalVisible(true);
  };

  const handleCloseModal = () => {
    setNameRegisterModalVisible(false);
  };

  const handleToggleDisplay = () => {
    setShowAddress(prevState => !prevState);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
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
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Nav className="me-auto">
            <Nav.Link onClick={handleSelectedTab(1)}>Calls</Nav.Link>
            <Nav.Link onClick={handleSelectedTab(2)}>Creators</Nav.Link>
            {factoryOwner.toLowerCase() === userAccount.toLowerCase() && (
              <Nav.Link onClick={handleSelectedTab(3)}>Administration</Nav.Link>
            )}
          </Nav>
          <Nav className="ml-auto" style={{ display: 'flex', alignItems: 'center' }}>
            {userAccount && (
              <OverlayTrigger
                placement="bottom"
                overlay={renderTooltip({}, userAccount)}
              >
                <span 
                  style={{ color: 'white', marginRight: '10px', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleCopyToClipboard(userAccount)}
                >
                  {showAddress ? userAccount : resolvedName && resolvedName + ".users.eth" || userAccount}
                </span>
              </OverlayTrigger>
            )}
            {userAccount ? (
              <>
                {resolvedName ? (
                  <button
                    onClick={handleToggleDisplay}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <img src={metamaskLogo} alt="MetaMask" style={{ width: 20, height: 20, marginRight: 8 }} />
                    {showAddress ? 'Show name' : 'Show address'}
                  </button>
                ) : (
                  <button
                    onClick={handleRegisterClick}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <img src={metamaskLogo} alt="MetaMask" style={{ width: 20, height: 20, marginRight: 8 }} />
                    Register a name
                  </button>
                )}
              </>
            ) : (
              <button onClick={connectMetaMask} style={{ display: 'flex', alignItems: 'center' }}>
                <img src={metamaskLogo} alt="MetaMask" style={{ width: 20, height: 20, marginRight: 8 }} />
                Connect MetaMask
              </button>
            )}
          </Nav>
        </Container>
      </Navbar>

      <NameRegisterModal show={nameRegisterModalVisible} onHide={handleCloseModal} signer={signer} />

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showCopiedToast} onClose={() => setShowCopiedToast(false)} delay={2000} autohide>
          <Toast.Body>Address copied to clipboard!</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

export default NavbarMenu;