import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Table, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import UploadProposalModal from "./UploadProposalModal";
import config from "../config";
import { ethers } from "ethers";
import { useMetaMask } from './MetamaskConnect';

interface CreatorProposalsModalProps {
    creator: string;
    modalVisible: boolean;
    setModalVisible: Function;
}

function CreatorProposalsModal({ creator, modalVisible, setModalVisible }: CreatorProposalsModalProps) {

    const { signer } = useMetaMask();
    const [calls, setProposals] = useState<string[]>([]);
    const [proposalModalVisible, setProposalModalVisible] = useState<boolean>(false);
    const [selectedCall, setSelectedProposal] = useState<string>("");
    const [creatorNames, setCreatorNames] = useState<{ [key: string]: string | null }>({});
    const [showAddress, setShowAddress] = useState(false);

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

    const toggleShowAddress = () => {
        setShowAddress(!showAddress);
    };

    useEffect(() => {
        if (creator) {
            resolveENSName(creator);
        }
    }, [creator]);

    const resolveENSName = async (address: string) => {
        if (!signer) return;

        try {
            const reverseNode = ethers.utils.namehash(`${address.slice(2)}.addr.reverse`);
            const contractAddress = config.PublicResolverContract?.address;
            const contractABI = config.PublicResolverContract?.abi;

            if (!contractAddress || !contractABI) {
                console.error("PublicResolver contract address or ABI is missing in the config.");
                return;
            }

            const publicResolver = new ethers.Contract(contractAddress, contractABI, signer);

            const name = await publicResolver.name(reverseNode);

            setCreatorNames(prevNames => ({
                ...prevNames,
                [address]: name || null,
            }));
        } catch (error) {
            console.error('Error resolving ENS name:', error);
            setCreatorNames(prevNames => ({
                ...prevNames,
                [address]: null,
            }));
        }
    };

    return (
        <>
            <Modal
                show={modalVisible}
                onHide={handleModalClose}
                backdrop="static"
                keyboard={false}
                size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Proposals by 
                        {creatorNames[creator] ? (
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id="tooltip-creator">{creator}</Tooltip>}
                            >
                                <span
                                    style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '10px' }}
                                    onClick={toggleShowAddress}
                                >
                                    {showAddress ? creator : creatorNames[creator]}
                                </span>
                            </OverlayTrigger>
                        ) : (
                            <span style={{ marginLeft: '10px' }}>{creator}</span>
                        )}
                    </Modal.Title>
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