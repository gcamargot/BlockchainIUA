// src/global.d.ts
interface Window {
    ethereum: {
      isMetaMask?: boolean;
      request: (...args: any[]) => Promise<void>;
    };
  }