import React, { useState, useEffect } from "react";
import NavbarMenu from "./components/Navbar";
import CallsTable from "./components/CallsTable";
import CreatorsTable from "./components/CreatorsTable";
import axios from "axios";
import Administration from "./components/Administration";
import config from "./config";
import { MetaMaskProvider, useMetaMask } from "./components/MetamaskConnect";

function AppContent() {
  const [selectedTab, setSelectedTab] = useState(1);
  const [owner, setOwner] = useState<string>("");
  const { connectMetaMask, userAccount } = useMetaMask();

  useEffect(() => {
    axios.get(config.apiUrl + config.endpoints.contractOwner, {
      headers: { "Access-Control-Allow-Origin": "*" },
    })
    .then((response): void => {
      setOwner(response.data["address"]);
    })
    .catch((error) => {
      console.error("Error fetching owner:", error);
    });
  }, []);

  function updateSelectedTab(tab: number) {
    setSelectedTab(tab);
  }

  return (
    <div className="App">
      <NavbarMenu
        setSelectedTab={updateSelectedTab}
        factoryOwner={owner}
        connectMetaMask={connectMetaMask}
        userAccount={userAccount}
      />
      <div>
        {selectedTab === 1 && <CallsTable />}
        {selectedTab === 2 && <CreatorsTable />}
        {selectedTab === 3 && <Administration />}
      </div>
    </div>
  );
}

function App() {
  return (
    <MetaMaskProvider>
      <AppContent />
    </MetaMaskProvider>
  );
}

export default App;