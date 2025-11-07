#!/bin/bash

# Farm to Stars - Easy Run Script
# This script handles everything needed to run the game

# Don't exit on error - we want to handle errors gracefully
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Farm to Stars - Setup & Run         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GAME_DIR="$SCRIPT_DIR/Game"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check .NET SDK
check_dotnet() {
    if command_exists dotnet; then
        DOTNET_VERSION=$(dotnet --version 2>/dev/null || echo "0.0.0")
        echo -e "${GREEN}✓${NC} .NET SDK found: $DOTNET_VERSION"
        
        # Check if version is 8.0 or higher
        MAJOR_VERSION=$(echo $DOTNET_VERSION | cut -d. -f1)
        if [ "$MAJOR_VERSION" -ge 8 ]; then
            return 0
        else
            echo -e "${YELLOW}⚠${NC} .NET SDK version is below 8.0. Need .NET 8.0 or higher."
            return 1
        fi
    else
        echo -e "${RED}✗${NC} .NET SDK not found"
        return 1
    fi
}

# Function to install .NET SDK
install_dotnet() {
    echo -e "${YELLOW}Installing .NET 8 SDK...${NC}"
    
    if command_exists brew; then
        echo -e "${BLUE}Using Homebrew to install .NET SDK...${NC}"
        if brew install --cask dotnet-sdk; then
            echo -e "${GREEN}✓${NC} .NET SDK installation started"
            echo -e "${YELLOW}Please wait for installation to complete...${NC}"
            
            # Wait a moment and reload PATH
            sleep 2
            export PATH="/usr/local/bin:$PATH"
            if [ -f "$HOME/.zshrc" ]; then
                source "$HOME/.zshrc" 2>/dev/null || true
            fi
            if [ -f "$HOME/.bash_profile" ]; then
                source "$HOME/.bash_profile" 2>/dev/null || true
            fi
            
            # Try to find dotnet in common locations
            if [ -f "/usr/local/share/dotnet/dotnet" ]; then
                export PATH="/usr/local/share/dotnet:$PATH"
            fi
        else
            echo -e "${RED}✗${NC} Installation failed. Please install manually:"
            echo -e "${YELLOW}Visit: https://dotnet.microsoft.com/download/dotnet/8.0${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Homebrew not found. Please install .NET SDK manually:${NC}"
        echo -e "${YELLOW}Visit: https://dotnet.microsoft.com/download/dotnet/8.0${NC}"
        echo -e "${YELLOW}Or install Homebrew first: https://brew.sh${NC}"
        exit 1
    fi
    
    # Verify installation
    if check_dotnet; then
        echo -e "${GREEN}✓${NC} .NET SDK installed successfully"
    else
        echo -e "${YELLOW}⚠${NC} .NET SDK may need a terminal restart. Trying common paths...${NC}"
        # Try common installation paths
        for path in "/usr/local/share/dotnet/dotnet" "/opt/homebrew/bin/dotnet" "$HOME/.dotnet/dotnet"; do
            if [ -f "$path" ]; then
                export PATH="$(dirname $path):$PATH"
                if check_dotnet; then
                    echo -e "${GREEN}✓${NC} Found .NET SDK"
                    return 0
                fi
            fi
        done
        echo -e "${RED}✗${NC} .NET SDK not found. Please restart terminal and try again."
        echo -e "${YELLOW}Or install manually: https://dotnet.microsoft.com/download/dotnet/8.0${NC}"
        exit 1
    fi
}

# Step 1: Check/Install .NET SDK
echo -e "${BLUE}[1/4]${NC} Checking .NET SDK..."
if ! check_dotnet; then
    echo -e "${YELLOW}.NET SDK not found. Attempting to install...${NC}"
    install_dotnet
fi
echo ""

# Step 2: Navigate to Game directory
echo -e "${BLUE}[2/4]${NC} Preparing project..."
cd "$GAME_DIR"

if [ ! -f "Game.csproj" ]; then
    echo -e "${RED}✗${NC} Game.csproj not found in $GAME_DIR"
    exit 1
fi
echo -e "${GREEN}✓${NC} Project found"
echo ""

# Step 3: Restore packages
echo -e "${BLUE}[3/4]${NC} Restoring NuGet packages..."
if dotnet restore --verbosity quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Packages restored"
else
    echo -e "${YELLOW}⚠${NC} Restoring packages (this may take a moment)..."
    dotnet restore
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Package restoration failed"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Packages restored"
fi
echo ""

# Step 4: Build project
echo -e "${BLUE}[4/4]${NC} Building project..."
if dotnet build --no-restore --verbosity quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${YELLOW}⚠${NC} Building project (this may take a moment)..."
    dotnet build --no-restore
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Build failed"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Build successful"
fi
echo ""

# Step 5: Run the game
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Launching Farm to Stars...           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Controls:${NC}"
echo -e "  ${BLUE}WASD${NC} - Move camera"
echo -e "  ${BLUE}Mouse Wheel${NC} - Zoom in/out"
echo -e "  ${BLUE}ESC${NC} - Exit game"
echo ""
echo -e "${GREEN}Starting game...${NC}"
echo ""

# Run the game
dotnet run --no-build

