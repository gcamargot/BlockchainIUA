#!/bin/bash

# Step 1: Check if the build folder exists and remove it if it does
if [ -d "./build" ]; then
    echo "Removing existing build folder..."
    rm -rf ./build
fi

# Step 2: Execute truffle deploy with reset
truffle deploy --reset

# Step 3: Run the Python API server in the background
python apiserver.py --mnemonic mnemonic.txt --build ./ &

# Step 4: Enter the frontCFP folder
cd frontCFP

# Step 5: Install npm dependencies
npm install

# Step 6: Start the development server
npm run dev