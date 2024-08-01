# Deployment and Setup Script

This script automates the process of deploying smart contracts, running a Python API server, and starting a frontend development server. After running the script, you can access the frontend via `http://localhost:5173/`.

## Prerequisites

Before running the script, make sure you have the following installed and configured:

- **Node.js and npm**
- **Python**
- **Truffle**
- **Ganache**: Ensure Ganache is running on your machine.
- **MetaMask**: For interacting with the frontend.
- **Mnemonic Phrase**: Place your mnemonic phrase in a file named `mnemonic.txt` in the root directory of your project.

## Usage

1. **Clone the repository** and navigate to the project directory.

2. **Make the script executable** (if not already done):
   ```bash
   chmod +x deploy_and_start.sh
   ```


3.	**Run the script with sudo:**
    ```bash
    sudo ./deploy_and_start.sh
    ```
    This script will:
	•	Check if a build folder exists, and if it does, remove it.
	•	Deploy the smart contracts using Truffle with the --reset option.
	•	Start the Python API server in the background, using the mnemonic phrase from mnemonic.txt, and connect to Ganache on the default port (7545) and network ID (5777).
	•	Navigate to the frontCFP directory.
	•	Install the necessary npm dependencies.
	•	Start the frontend development server.

4.	**Access the frontend via the following URL:**
    http://localhost:5173/

You should now see the frontend of your project running. Make sure MetaMask is set up and connected to interact with the deployed contracts.

## Additional Information

•	Customizing API Server Options: The Python API server accepts additional arguments:
•	--mnemonic: Specify a different mnemonic file or path if needed.
•	--gport: Specify a different Ganache port number if Ganache is running on a non-default port.
•	--network: Specify a different Ganache network ID if needed.

•	Stopping the Python Server: Since the Python server is running in the background, you may need to manually stop it. You can find the process using ps and kill it with kill:
    
```bash
ps aux | grep apiserver.py
sudo kill <PID> 
```
•	Re-running the Script: You can re-run the script anytime you need to redeploy or restart the servers. The script will handle cleaning up the previous build directory automatically.

## Troubleshooting

•	Permission Issues: Ensure you run the script with sudo to avoid permission issues.
•	Port Conflicts: If the frontend server fails to start, ensure no other processes are using port 5173.