import { Container, Nav, Navbar } from 'react-bootstrap';
import metamaskLogo from '../assets/metamask-logo.png'; // Adjust the path as needed

interface NavbarProps {
  setSelectedTab: (tab: number) => void;

  factoryOwner: string;
  connectMetaMask: () => Promise<void>;
  userAccount: string;
}

function NavbarMenu({ setSelectedTab, factoryOwner, connectMetaMask, userAccount }: NavbarProps) {
  const handleSelectedTab = (tab: number) => () => {
    setSelectedTab(tab);
  }

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Nav className="me-auto">
            <Nav.Link onClick={handleSelectedTab(1)}>Calls</Nav.Link>
            <Nav.Link onClick={handleSelectedTab(2)}>Creators</Nav.Link>
            {factoryOwner.toLowerCase() === userAccount.toLowerCase() && <Nav.Link onClick={handleSelectedTab(3)}>Administration</Nav.Link>}
          </Nav>
          <Nav className="ml-auto" style={{ display: 'flex', alignItems: 'center' }}>
            {userAccount && <span style={{ color: 'white', marginRight: '10px' }}>{userAccount}</span>}
            {userAccount ? (
              <button style={{ display: 'flex', alignItems: 'center' }}>
              <img src={metamaskLogo} alt="MetaMask" style={{ width: 20, height: 20, marginRight: 8 }} />
              MetaMask Conected
            </button>
            ) : (
              <button onClick={connectMetaMask} style={{ display: 'flex', alignItems: 'center' }}>
                <img src={metamaskLogo} alt="MetaMask" style={{ width: 20, height: 20, marginRight: 8 }} />
                Connect MetaMask
              </button>
            )}
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

export default NavbarMenu;