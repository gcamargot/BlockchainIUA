import axios from 'axios';
import { useState, useEffect } from 'react';
import { Table, Button, OverlayTrigger, Tooltip, Toast, ToastContainer } from 'react-bootstrap';
import CreatorProposalsModal from './CreatorProposalsModal';
import UploadProposalModal from './UploadProposalModal';
import config from '../config';
import { useMetaMask } from './MetamaskConnect';
import { ethers } from 'ethers';

function CreatorsTable() {
    const { signer } = useMetaMask();
    const [creators, setCreators] = useState<string[]>([]);
    const [creatorNames, setCreatorNames] = useState<{ [key: string]: string | null }>({});
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [creatorModalVisible, setCreatorModalVisible] = useState<boolean>(false);
    const [uploadModalVisible, setUploadModalVisible] = useState<boolean>(false);
    const [selectedCallId, setSelectedCallId] = useState<string>("");
    const [selectedCFP, setSelectedCFP] = useState<string>("");
    const [showCopiedToast, setShowCopiedToast] = useState(false);
    const [showAddress, setShowAddress] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        axios
          .get(config.apiUrl + config.endpoints.creators, {
            headers: { "Access-Control-Allow-Origin": "*" },
          })
          .then((response): void => {
            const creatorsList: string[] = response.data["creators"];
            const uniqueCreators = Array.from(new Set(creatorsList));
            setCreators(uniqueCreators);
            uniqueCreators.forEach((creator) => {
                resolveENSName(creator);
            });
          })
          .catch((error) => {
            console.error("Error fetching creators:", error);
          });
      }, []);

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

    const handleCreatorClick = (creator: string) => {
        setSelectedCreator(creator);
        setCreatorModalVisible(true);
    };

    const handleNameClick = async (creator: string) => {
        await navigator.clipboard.writeText(creator);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
    };

    const toggleShowAddress = (creator: string) => {
        setShowAddress(prevState => ({
            ...prevState,
            [creator]: !prevState[creator]
        }));
    };

    const handleOpenUploadModal = (callId: string, cfp: string) => {
        setSelectedCallId(callId);
        setSelectedCFP(cfp);
        setCreatorModalVisible(false); // Hide CreatorProposalsModal
        setUploadModalVisible(true); // Show UploadProposalModal
    };

    const handleCloseUploadModal = () => {
        setUploadModalVisible(false); // Hide UploadProposalModal
        setCreatorModalVisible(true); // Show CreatorProposalsModal
    };

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
                            <td>
                                <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip id={`tooltip-${index}`}>{creator}</Tooltip>}
                                >
                                    <span
                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => handleNameClick(creator)}
                                        onDoubleClick={() => toggleShowAddress(creator)}
                                    >
                                        {showAddress[creator] || !creatorNames[creator] ? creator : creatorNames[creator]}
                                    </span>
                                </OverlayTrigger>
                            </td>
                            <td>
                                <Button variant="primary" onClick={() => handleCreatorClick(creator)}>
                                    Check all his calls
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {creatorModalVisible && (
                <CreatorProposalsModal
                    creator={selectedCreator}
                    modalVisible={creatorModalVisible}
                    setModalVisible={setCreatorModalVisible}
                    onOpenUploadProposal={handleOpenUploadModal} // Pass function to open UploadProposalModal
                />
            )}
            {uploadModalVisible && (
                <UploadProposalModal
                    selectedCallId={selectedCallId}
                    selectedCFP={selectedCFP}
                    modalVisible={uploadModalVisible}
                    setModalVisible={handleCloseUploadModal} // Close UploadProposalModal and show CreatorProposalsModal
                />
            )}
            <ToastContainer position="top-end" className="p-3">
                <Toast show={showCopiedToast} onClose={() => setShowCopiedToast(false)} delay={2000} autohide>
                    <Toast.Body>Address copied!</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
}

export default CreatorsTable;