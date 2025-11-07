# Build & Publish

## Prereqs
- .NET 8 SDK+, MonoGame DesktopGL templates installed, MGCB wired.

## Commands
```bash
# Run
dotnet run

# Publish single-file self-contained (Windows example)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```
