import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Table, Button } from "react-bootstrap";
import UploadProposalModal from "./UploadProposalModal";
import config from "../config";

interface CreatorProposalsModalProps {
    creator: string;
    modalVisible: boolean;
    setModalVisible: Function;
}

function CreatorProposalsModal({ creator, modalVisible, setModalVisible }: CreatorProposalsModalProps) {

    const [calls, setProposals] = useState<string[]>([]);
    const [proposalModalVisible, setProposalModalVisible] = useState<boolean>(false);
    const [selectedCall, setSelectedProposal] = useState<string>("");

    function handleModalClose() {
        setModalVisible(false);
    }

    function handleProposalClick(call: string) {
        setSelectedProposal(call);
        setProposalModalVisible(true);
    }

    useEffect(() => {
        if (creator) {
            axios.get(config.apiUrl + config.endpoints.createdBy + creator, {
                headers: { "Access-Control-Allow-Origin": "*" },
            })
                .then((response): void => {
                    setProposals(response.data["calls"]);
                })
                .catch((error) => {
                    console.error("Error fetching proposals:", error);
                });
        }
    }, [creator]);

    return (
        <>
            <Modal
                show={modalVisible}
                onHide={handleModalClose}
                backdrop="static"
                keyboard={false}
                size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Proposals by {creator}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Index</th>
                                <th>Call</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.map((call, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>0x{call}</td>
                                    <td>
                                        <Button variant="primary" onClick={() => handleProposalClick(call)}>
                                            Register a proposal
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
            {proposalModalVisible && <UploadProposalModal selectedCallId={selectedCall} modalVisible={proposalModalVisible} setModalVisible={setProposalModalVisible} />}
        </>
    );
}

export default CreatorProposalsModal;