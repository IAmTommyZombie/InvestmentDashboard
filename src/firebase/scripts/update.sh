#!/bin/bash

# Navigate to the scripts directory
cd "$(dirname "$0")"

# Run the update script
echo "Starting update process..."
node updateAll.js

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "Update completed successfully"
else
    echo "Update failed"
    exit 1
fi
