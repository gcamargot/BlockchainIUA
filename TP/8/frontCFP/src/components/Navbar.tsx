import {Container, Nav, Navbar} from 'react-bootstrap';
import MetamaskConnect from './MetamaskConnect';
import { useState } from 'react';

interface NavbarProps {
  setSelectedTab: Function;
  setSelectedWallet: Function;
  setUserAccount: Function;
  factoryOwner: string;

}

function NavbarMenu({setSelectedTab, setSelectedWallet, setUserAccount, factoryOwner}: NavbarProps) {

  const [currentAccount, setCurrentAccount] = useState<string>("");

  function handleSelectedTab(tab: number){
    return () => {
      setSelectedTab(tab);
    }
  }
  function handleUserAccount(account: string){
    setUserAccount(account);
    setCurrentAccount(account);
  }

  return (
    <>
    <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Nav className="me-auto">
            <Nav.Link onClick={handleSelectedTab(1)}>Calls</Nav.Link>
            <Nav.Link onClick={handleSelectedTab(2)}>Creators</Nav.Link>
            {factoryOwner.toLowerCase() === currentAccount && <Nav.Link onClick={handleSelectedTab(3)}>Administration</Nav.Link>}
          </Nav>
          <Nav className="ml-auto">
            <MetamaskConnect setSelectedWallet={setSelectedWallet} setUserAccount={handleUserAccount} />
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};

export default NavbarMenu;
