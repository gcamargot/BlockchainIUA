import Table from "react-bootstrap/Table";
import axios from "axios";
import { useEffect, useState } from "react";
import UploadProposalModal from "./UploadProposalModal";

const apiUrl = "http://127.0.0.1:5000";

interface Call {
  callId: string;
  cfp: string;
  creator: string;
  closingTime: string;
}

function CallsTable() {
  const getCallsEndPoint = "/calls";
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCalllId] = useState("");
  const [modalUploadVisible, setUploadModalVisible] = useState(false);

  useEffect(() => {
    axios
      .get(apiUrl + getCallsEndPoint, {
        headers: { "Access-Control-Allow-Origin": "*" },
      })
      .then((response): void => {
        setCalls(response.data["callsList"]);
      })
      .catch((error) => {
        console.error("Error fetching pending:", error);
      });
  }, []);

  const handleCallClick = (call: Call) => {
    setSelectedCalllId(call.callId);
    setUploadModalVisible(true);
  };

  return (
    <div style={{display: 'flex',  justifyContent:'center', alignItems:'top', height: '100vh', top:'0'}}>
    <Table responsive>
      <thead>
        <tr>
          <th>CFP</th>
          <th>Creator</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>
        {calls.map((call, index) => (
          <tr key={index} onClick={() => handleCallClick(call)}>
            <td >{call.cfp}</td>
            <td >
              {call.creator}
            </td>
            <td>{call.closingTime}</td>
          </tr>
        ))}
      </tbody>
      <UploadProposalModal
        selectedCallId={selectedCallId}
        modalVisible={modalUploadVisible}
        setModalVisible={setUploadModalVisible}
      />
    </Table>
    </div>
  );
}

export default CallsTable;
