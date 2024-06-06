import { useState, useEffect } from "react";
import axios from "axios";
import { Table } from "react-bootstrap";

const apiUrl = "http://127.0.0.1:5000";
const pendingEndpoint = "/pending";

function Administration() {
  const [pending, setPending] = useState<string[]>([]);
    useEffect(() => {
        fetchPending();
    }, []);

 function fetchPending() {
        axios
          .get(apiUrl + pendingEndpoint, {
            headers: { "Access-Control-Allow-Origin": "*" },
          })
          .then((response): void => {
            setPending(response.data["pending"]);
          })
          .catch((error) => console.error("Error fetching pending:", error));
 }   

  function handleApprove(address: any) {

    axios.post(apiUrl + "/authorize/"+address, {  })
    .then((response) => {
        fetchPending();
    });
}

  function handleReject(){

  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "top",
        height: "100vh",
        top: "0",
      }}
    >
      <Table responsive>
        <thead>
          <tr>
            <th>Index</th>
            <th>Creator</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((p, index) => (
            <tr key={index} >
                <td>{index}</td>
              <td>{p}</td>
              <td>
                <button onClick={() => handleApprove(p)}>Approve</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
export default Administration;
