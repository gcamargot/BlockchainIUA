import axios from 'axios';
import { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import CreatorProposalsModal from './CreatorProposalsModal';
import config from '../config';

function CreatorsTable(){

    const [creators, setCreators] = useState<string[]>([]);    
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [creatorModalVisible, setCreatorModalVisible] = useState<boolean>(false);

    useEffect(() => {
        axios
          .get(config.apiUrl + config.endpoints.creators, {
            headers: { "Access-Control-Allow-Origin": "*" },
          })
          .then((response): void => {
            setCreators(response.data["creators"]);
          })
          .catch((error) => {
            console.error("Error fetching creators:", error);
          });
      }, []);

    function handleCreatorClick(creator: string){
        setSelectedCreator(creator);
        setCreatorModalVisible(true);
    }

    return (
        <div className="d-flex justify-content-center align-items-top" style={{ height: '100vh', paddingTop: '20px' }}>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Index</th>
                        <th>Creator</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {creators.map((creator, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{creator}</td>
                            <td>
                                <Button variant="primary" onClick={() => handleCreatorClick(creator)}>
                                    Check all his calls
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {creatorModalVisible && <CreatorProposalsModal creator={selectedCreator} modalVisible={creatorModalVisible} setModalVisible={setCreatorModalVisible} />}
        </div>
    );
}

export default CreatorsTable;