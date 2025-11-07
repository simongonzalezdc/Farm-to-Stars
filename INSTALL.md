# Installation Guide

## Super Easy Way (Recommended)

**Just double-click `run.command`** - The script does everything!

## What the Script Does

The `run.sh` script automatically:

1. ✅ Checks if .NET 8 SDK is installed
2. ✅ Installs it via Homebrew if needed
3. ✅ Restores all NuGet packages
4. ✅ Builds the project
5. ✅ Launches the game

## Manual Installation

If you prefer to install manually:

### Step 1: Install .NET 8 SDK

**Option A: Using Homebrew (Recommended)**
```bash
brew install --cask dotnet-sdk
```

**Option B: Download from Microsoft**
1. Visit: https://dotnet.microsoft.com/download/dotnet/8.0
2. Download the macOS installer
3. Run the installer
4. Follow the installation wizard

### Step 2: Verify Installation

```bash
dotnet --version
```

Should show: `8.0.x` or higher

### Step 3: Run the Game

```bash
cd Game
dotnet restore
dotnet run
```

## Troubleshooting

### "dotnet: command not found"

After installing .NET SDK, you may need to:
1. Restart your terminal
2. Or run: `source ~/.zshrc` (or `~/.bash_profile`)

### Homebrew Not Found

Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Permission Errors

Make sure the script is executable:
```bash
chmod +x run.sh
chmod +x run.command
```

### Build Errors

Try cleaning and rebuilding:
```bash
cd Game
dotnet clean
dotnet restore
dotnet build
```

## System Requirements

- **OS**: macOS 10.15+ (tested on macOS 14+)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: ~500MB for SDK and packages
- **Graphics**: Any modern graphics card

## Next Steps

Once installed, just run:
```bash
./run.sh
```

Or double-click `run.command`!

