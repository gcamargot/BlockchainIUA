import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { ethers } from 'ethers';
import config from '../config';

interface NameRegisterModalProps {
  show: boolean;
  onHide: () => void;
  signer: ethers.Signer | null;
}

function NameRegisterModal({ show, onHide, signer }: NameRegisterModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const node = nameHash(name + "users.eth");
      console.log("Node: ", node);
      const resolverAddress = await ensRegistryContract.resolver(node);
      return resolverAddress !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
      console.log("Error al verificar si el usuario está registrado: ", error);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!signer) {
      alert('Please connect to MetaMask');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const userFIFSRegistrarContract = new ethers.Contract(
        config.UserFIFSRegistrarContract.address,
        config.UserFIFSRegistrarContract.abi,
        signer
      );
  
      const publicResolverContract = new ethers.Contract(
        config.PublicResolverContract.address,
        config.PublicResolverContract.abi,
        signer
      );
  
      const ensRegistryContract = new ethers.Contract(
        config.ENSRegistryContract.address,
        config.ENSRegistryContract.abi,
        signer
      );
  
      const reverseRegistrarContract = new ethers.Contract(
        config.ReverseRegistryContract.address,
        config.ReverseRegistryContract.abi,
        signer
      );
  
      const nameWithDomain = `${name}.users.eth`;
      console.log("Name with domain: ", nameWithDomain);
      const userAccount = await signer.getAddress();
      console.log("User account: ", userAccount);
      const isRegistered = await isUserRegistered(name, ensRegistryContract);
      console.log("Is registered: ", isRegistered);
  
      if (isRegistered) {
        alert("El nombre ya está registrado.");
        setIsLoading(false);
        return;
      }
  
      // Register the name
      const registerTx = await userFIFSRegistrarContract.register(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)), userAccount);
      await registerTx.wait();
      console.log("Register receipt: ", registerTx);
  
      // Set the address in the resolver
      const setAddrTx = await publicResolverContract.setAddr(nameHash(nameWithDomain), userAccount);
      await setAddrTx.wait();
      console.log("Set Addr receipt: ", setAddrTx);
  
      // Set the resolver for the ENS name
      const setResolverTx = await ensRegistryContract.setResolver(nameHash(nameWithDomain), publicResolverContract.address);
      await setResolverTx.wait();
      console.log("Set Resolver receipt: ", setResolverTx);
  
      // Set the reverse name
      const setNameTx = await reverseRegistrarContract.setName(name);
      await setNameTx.wait();
      console.log("Set Name receipt: ", setNameTx);
  
      // Verify the address set in the resolver
      const resolvedAddress = await publicResolverContract.addr(nameHash(nameWithDomain));
      console.log("Resolved address: ", resolvedAddress);
  
      if (resolvedAddress.toLowerCase() === userAccount.toLowerCase()) {
        alert(`El nombre ${name}.users.eth ha sido registrado exitosamente.`);
      } else {
        alert(`La dirección resuelta ${resolvedAddress} no coincide con la dirección del usuario ${userAccount}.`);
      }
  
      onHide(); // Close the modal after registration
    } catch (err) {
        console.error('Error during name registration:', err);
    
        if (err instanceof Error) {
          if (err.message.includes('CALL_EXCEPTION')) {
            alert(`Error de permisos: ${err.message}`);
          } else if (err.message.includes('4001')) {
            alert('El usuario ha cancelado la petición de firma.');
          } else {
            alert(`Error desconocido: ${err.message}`);
          }
        } else {
          alert('Se produjo un error desconocido.');
        }
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Registrar Nombre</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formName">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre a registrar"
              disabled={isLoading}
            />
          </Form.Group>
        </Form>
        {isLoading && <Spinner animation="border" />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleRegister} disabled={isLoading || !name}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NameRegisterModal;