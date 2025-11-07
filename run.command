#!/bin/bash

# macOS .command file - double-click to run
# This opens Terminal and runs the game

cd "$(dirname "$0")"
./run.sh

# Keep terminal open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "Press any key to exit..."
    read -n 1
fi

