import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Table, Button, OverlayTrigger, Tooltip, Form } from "react-bootstrap";
import config from "../config";
import { ethers } from "ethers";
import { useMetaMask } from './MetamaskConnect';

interface CreatorProposalsModalProps {
    creator: string;
    modalVisible: boolean;
    setModalVisible: Function;
    onOpenUploadProposal: (callId: string, cfp: string) => void; // Function to open UploadProposalModal
}

interface Call {
  callId: string;
  cfp: string;
  creator: string;
  closingTime: string;
}

function CreatorProposalsModal({ creator, modalVisible, setModalVisible, onOpenUploadProposal }: CreatorProposalsModalProps) {
    const { signer } = useMetaMask();
    const [proposals, setProposals] = useState<Array<{ id: string, cfp: string }>>([]);
    const [allCalls, setAllCalls] = useState<Call[]>([]); // Store all calls for comparison
    const [callNames, setCallNames] = useState<{ [key: string]: string | null }>({});
    const [creatorNames, setCreatorNames] = useState<{ [key: string]: string | null }>({});
    const [showAddress, setShowAddress] = useState(false);
    const [showExpired, setShowExpired] = useState(false); // Toggle to show/hide expired proposals
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null); // State for sorting

    function handleModalClose() {
        setModalVisible(false);
    }

    function handleProposalClick(call: { id: string, cfp: string }) {
        onOpenUploadProposal(call.id, call.cfp); // Open the UploadProposalModal
    }

    useEffect(() => {
        // Fetch all calls
        axios.get(config.apiUrl + config.endpoints.calls)
            .then((response): void => {
                setAllCalls(response.data.callsList);
            })
            .catch((error) => {
                console.error("Error fetching all calls:", error);
            });
    }, []);

    useEffect(() => {
        if (creator) {
            axios.get(config.apiUrl + config.endpoints.createdBy + creator, {
                headers: { "Access-Control-Allow-Origin": "*" },
            })
                .then(async (response): Promise<void> => {
                    const calls = response.data["calls"];

                    // Perform a second query for each call to fetch the CFP data
                    const cfpPromises = calls.map((call: string) =>
                        axios.get(config.apiUrl + config.endpoints.calls + "/0x" + call)
                            .then(response => ({ id: call, cfp: response.data["cfp"] }))
                            .catch(error => {
                                console.error(`Error fetching CFP for call ${call}:`, error);
                                return null; // Return null in case of error
                            })
                    );

                    // Resolve all the CFP promises
                    const cfpResults = await Promise.all(cfpPromises);

                    // Filter out any null values (in case any requests failed)
                    const validCfpResults = cfpResults.filter(cfp => cfp !== null);

                    // Update the state with the valid CFP results
                    setProposals(validCfpResults as Array<{ id: string, cfp: string }>);

                    // Resolve names for each proposal
                    validCfpResults.forEach(proposal => {
                        resolveCallName(proposal.cfp);
                    });
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

    const resolveCallName = async (address: string) => {
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

            setCallNames(prevNames => ({
                ...prevNames,
                [address]: name || null,
            }));
        } catch (error) {
            console.error('Error resolving ENS name:', error);
            setCallNames(prevNames => ({
                ...prevNames,
                [address]: null,
            }));
        }
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Address copied to clipboard!');
        }).catch((error) => {
            console.error('Failed to copy address:', error);
        });
    };

    const renderTooltip = (props: any, address: string) => (
        <Tooltip id="button-tooltip" {...props}>
            {address}
        </Tooltip>
    );

    const isExpired = (cfp: string) => {
        const call = allCalls.find(call => call.cfp === cfp);
        return call ? new Date(call.closingTime) < new Date() : false;
    };

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedProposals = () => {
        if (!sortConfig) return proposals;
        const sortedProposals = [...proposals].sort((a, b) => {
            const aValue = sortConfig.key === 'cfp' ? callNames[a.cfp] || a.cfp : a.id;
            const bValue = sortConfig.key === 'cfp' ? callNames[b.cfp] || b.cfp : b.id;

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortedProposals;
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
                        Calls by 
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
                    <div className="mb-3">
                        <Form.Check 
                            type="switch"
                            id="show-expired-switch"
                            label="Show expired"
                            checked={showExpired}
                            onChange={() => setShowExpired(!showExpired)} // Toggle show/hide expired proposals
                        />
                    </div>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('index')}>Index</th>
                                <th onClick={() => handleSort('cfp')}>Call</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProposals()
                                .filter(proposal => showExpired || !isExpired(proposal.cfp))
                                .map((proposal, index) => {
                                    const expired = isExpired(proposal.cfp);
                                    return (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={(props) => renderTooltip(props, proposal.cfp)}
                                                >
                                                    <span
                                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                        onClick={() => handleCopyToClipboard(proposal.cfp)}
                                                    >
                                                        {callNames[proposal.cfp] && callNames[proposal.cfp] + ".calls.eth" || proposal.cfp}
                                                    </span>
                                                </OverlayTrigger>
                                            </td>
                                            <td>
                                                <Button 
                                                    variant={expired ? "secondary" : "primary"} 
                                                    onClick={() => handleProposalClick(proposal)} 
                                                    disabled={expired}
                                                >
                                                    Register a proposal
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default CreatorProposalsModal;