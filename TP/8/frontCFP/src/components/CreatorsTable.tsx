import axios from 'axios';
import { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import CreatorProposalsModal from './CreatorProposalsModal';

const apiUrl = "http://127.0.0.1:5000";

function CreatorsTable(){

    const getCreatorsEndPoint = "/creators"
    const [creators, setCreators] = useState<string[]>([]);    
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [creatorModalVisible, setCreatorModalVisible] = useState<boolean>(false);

    useEffect(() => {
        axios
          .get(apiUrl + getCreatorsEndPoint, {
            headers: { "Access-Control-Allow-Origin": "*" },
          })
          .then((response): void => {
            setCreators(response.data["creators"]);
          })
          .catch((error) => {
            console.error("Error fetching pending:", error);
          });
      }, []);

    function handleCreatorClick(creator: any){
        setSelectedCreator(creator);
        setCreatorModalVisible(true);
    }

    return (
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'top', height: '100vh', top:'0'}}>
        <Table responsive>
            <thead>
                <tr>
                    <th>Index</th>
                    <th>Creator</th>
                </tr>
            </thead>
            <tbody>
                {creators.map((creator, index) => (
                    <tr key={index} onClick={() => handleCreatorClick(creator)}>
                        <td>{index}</td>
                        <td>{creator}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
        {creatorModalVisible && <CreatorProposalsModal creator={selectedCreator} modalVisible={creatorModalVisible} setModalVisible={setCreatorModalVisible} />}
        </div>
    );
}

export default CreatorsTable;