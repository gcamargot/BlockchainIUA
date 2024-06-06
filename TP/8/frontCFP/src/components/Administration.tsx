import { useState, useEffect } from "react";
import axios from "axios";

const apiUrl = "http://127.0.0.1:5000"
const pendingEndpoint = "/pending";

function Administration (){

    const [pending, setPending] = useState<string[]>([]);

    useEffect(() => {
        axios.get(apiUrl + pendingEndpoint,{
            headers: { "Access-Control-Allow-Origin": "*" },
        })
        .then((response): void =>{
            setPending(response.data["pending"]);
            console.log(response.data);
        })
        .catch(error => console.error("Error fetching pending:", error));
    }, []);

    return (
        <div>
            <h1>#TODO</h1>
        </div>
    );
}
export default Administration;