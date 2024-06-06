import { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import UploadProposalModal from "./UploadProposalModal";

interface CreatorProposalsModalProps {
    creator: string;
    modalVisible: boolean;
    setModalVisible: Function;
}

const apiUrl = "http://127.0.0.1:5000"
const getCreatorProposalsEndPoint = "/createdBy/"

function CreatorProposalsModal({creator, modalVisible, setModalVisible}: CreatorProposalsModalProps){
    
    const [calls, setProposals] = useState<string[]>([]);
    const [proposalModalVisible, setProposalModalVisible] = useState<boolean>(false);
    const [selectedCall, setSelectedProposal] = useState<string>("");

    function handleModalClose(){
        setModalVisible(false);
    }

    function handleProposalClick(proposal: any){
        setSelectedProposal(proposal);
        setProposalModalVisible(true);
    }

    
    if(creator){
    useEffect(() => {
        axios.get(apiUrl + getCreatorProposalsEndPoint + creator, {
            headers: { "Access-Control-Allow-Origin": "*" },
        })
        .then((response): void => {
            setProposals(response.data["calls"]);
        })
        .catch((error) => {
            console.error("Error fetching proposals:", error);
        });
        } , []);
    }
    return (
        <>
        <Modal
        show = {modalVisible}
        onHide={handleModalClose}
        backdrop="static"
        keyboard={false}
        size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Proposals by {creator}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <ul>
            {calls.map((call, index) => (
                <li key={index} onClick={() => handleProposalClick(call)}>{call}</li>
            ))}
        </ul>
        </Modal.Body>
        </Modal>
        {proposalModalVisible && <UploadProposalModal selectedCallId={selectedCall} modalVisible={proposalModalVisible} setModalVisible={setProposalModalVisible}/>}
        </>
        )
}
export default CreatorProposalsModal;