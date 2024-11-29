import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';

type MetaMaskContextType = {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  userAccount: string;
  setUserAccount: React.Dispatch<React.SetStateAction<string>>;
  connectMetaMask: () => Promise<void>;
};

type MetaMaskProviderProps = {
  children: ReactNode;
};

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAccount, setUserAccount] = useState<string>('');

  const connectMetaMask = async () => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      await web3Provider.send("eth_requestAccounts", []);
      const signer = web3Provider.getSigner();
      setSigner(signer);
      const userAccount = await signer.getAddress();
      setUserAccount(userAccount);

      // Listen for account changes
      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    } else {
      console.error("MetaMask is not installed");
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setUserAccount(accounts[0]);
    } else {
      setUserAccount('');
    }
  };

  useEffect(() => {
    // Check if user is already connected on initial load
    const checkInitialConnection = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          setProvider(web3Provider);
          const signer = web3Provider.getSigner();
          setSigner(signer);
          setUserAccount(accounts[0]);

          // Listen for account changes
          (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
        }
      }
    };

    checkInitialConnection();

    // Clean up the event listener when the component unmounts
    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <MetaMaskContext.Provider value={{ provider, signer, userAccount, setUserAccount, connectMetaMask }}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
};