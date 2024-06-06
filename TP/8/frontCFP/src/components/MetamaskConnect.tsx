import { useSyncProviders } from "../hooks/useSyncProviders";
import { useState } from "react";
interface MetamaskConnectProps {
    setSelectedWallet: Function;
    setUserAccount: Function;
    }

const MetamaskConnect = ({setSelectedWallet, setUserAccount}: MetamaskConnectProps ) => {
  const providers = useSyncProviders();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>("");
  // Connect to the selected provider using eth_requestAccounts.
  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    providers.forEach(async (provider) => {
      if (provider.info.name === "MetaMask") {
        try {
          setIsLoading(true);
          const accounts: string[] = (await providerWithInfo.provider.request({
            method: "eth_requestAccounts",
          })) as string[];
          setIsConnected(true);
          setIsLoading(false);
          setSelectedWallet(providerWithInfo)
          setUserAccount(accounts?.[0])
          setCurrentAccount(accounts?.[0]);
        } catch (error) {
          // El usuario cancelo la peticion de conexion
          setIsLoading(false);
        }
      }
    });
  };

  return (
    <div>
      {providers.length > 0 ? (
        providers?.map((provider: EIP6963ProviderDetail, i) =>
          isConnected ? (
            <>
            {provider.info.name === "MetaMask" &&
            < >
              <a style={{color:"lightgrey"}} key={i}>{currentAccount}</a>
              <button 
                key={provider.info.uuid + i}
                
              >
                <img src={provider.info.icon} alt={provider.info.name} />
              </button>
            </>
            }</>
          ) : (
            <>{provider.info.name === "MetaMask" && 
              <button
                key={provider.info.uuid}
                onClick={() => handleConnect(provider)}
              >
                <img src={provider.info.icon} alt={provider.info.name} />
                <div>Conectar con {provider.info.name}</div>
              </button>
            }
            </>
          )
        )
      ) : (
        // Que mostrar cuando no te detecta ninguna wallet
        <>
          <a>No hay wallet</a>{" "}
        </>
      )}
    </div>
  );
};

export default MetamaskConnect;
