import NavbarMenu from "./components/Navbar";
import CallsTable from "./components/CallsTable";
import CreatorsTable from "./components/CreatorsTable";
import { useState, useEffect } from "react";
import axios from "axios";
import Administration from "./components/Administration";

const apiUrl = "http://127.0.0.1:5000";
const contractOwnerEndpoint = "/contract-owner";

function App() {

  const [selectedTab, setSelectedTab] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [userAccount, setUserAccount] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  
  useEffect(() => {
    axios.get(apiUrl + contractOwnerEndpoint, {
      headers: { "Access-Control-Allow-Origin": "*" },
    })
    .then((response): void => {
      setOwner(response.data["address"]);
    })
    .catch((error) => {
      console.error("Error fetching owner:", error);
    });
  }, []);
  
  function updateSelectedTab(tab: number){
    setSelectedTab(tab);
  }

  function handleUserAccount(account: string){
    setUserAccount(account);
  }

  
  return (
    <div className="App">
      <NavbarMenu setSelectedTab={updateSelectedTab} setSelectedWallet={setSelectedWallet} setUserAccount={handleUserAccount} factoryOwner={owner}/>
      <div>
        {selectedTab === 1 && <CallsTable />}
        {selectedTab === 2 && <CreatorsTable/>}
        {selectedTab === 3 && <Administration/>}
      </div>
      
    </div>
  );
}

export default App;
