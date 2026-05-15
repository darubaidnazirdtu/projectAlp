<#
bootstrap.ps1
Automates local setup checks and runs dependency installation for the workspace.
Usage: PowerShell (run as normal user):
  powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1

This script will:
- Check for `node`, `npm`, `git`, and `mongod` (MongoDB server).
- Offer to install Node and Git via `winget` if missing.
- Copy backend/.env from .env.example and create frontend/.env with `VITE_BASEURL` if absent.
- Run the existing `install-all.ps1` to install npm packages in all subprojects.
#>

Param(
    [switch]$AutoConfirm
)

function Write-Info($m) { Write-Host $m -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host $m -ForegroundColor Yellow }
function Write-Err($m) { Write-Host $m -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root
Write-Info "Workspace root: $root"

function Command-Exists($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

$hasWinget = Command-Exists 'winget'
if (-not $hasWinget) { Write-Warn "winget not found. Automatic installs via winget disabled." }

# Check Node
if (-not (Command-Exists 'node')) {
    Write-Warn "Node.js not found."
    if ($hasWinget) {
        if ($AutoConfirm -or (Read-Host "Install Node.js LTS via winget? (Y/n)") -ne 'n') {
            Write-Info "Installing Node.js LTS via winget..."
            winget install --id OpenJS.NodeJS.LTS -e
        }
    } else {
        Write-Err "Please install Node.js LTS from https://nodejs.org/ and re-run this script."
        return
    }
} else {
    Write-Info "Node found: $(node --version)"
}

# Check npm
if (-not (Command-Exists 'npm')) {
    Write-Warn "npm not found. Ensure Node.js installation provides npm."
}

# Check git
if (-not (Command-Exists 'git')) {
    Write-Warn "Git not found."
    if ($hasWinget) {
        if ($AutoConfirm -or (Read-Host "Install Git via winget? (Y/n)") -ne 'n') {
            Write-Info "Installing Git via winget..."
            winget install --id Git.Git -e
        }
    } else {
        Write-Err "Please install Git from https://git-scm.com/downloads and re-run this script."
    }
} else {
    Write-Info "Git found: $(git --version)"
}

# Check MongoDB (mongod)
if (-not (Command-Exists 'mongod')) {
    Write-Warn "MongoDB server (mongod) not found. The app uses MongoDB via MONGODB_URI."
    Write-Host "Installation options:"
    Write-Host "  1) Install MongoDB Community Server manually: https://www.mongodb.com/try/download/community"
    if ($hasWinget) {
        if ($AutoConfirm -or (Read-Host "Attempt to install MongoDB via winget? (Not guaranteed) (Y/n)") -ne 'n') {
            Write-Info "Attempting winget install for MongoDB Community Server..."
            winget install --id MongoDB.MongoDBCommunity -e
            Write-Info "If winget id fails, please install MongoDB manually from the link above."
        }
    }
} else {
    Write-Info "MongoDB found: mongod present"
}

# Create backend .env from example if missing
$backendEnv = Join-Path $root 'backend\.env'
$backendEnvExample = Join-Path $root 'backend\.env.example'
if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvExample) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Info "Created backend/.env from .env.example. Please update secrets (JWT_SECRET, CLOUDINARY_*, etc.)."
    } else {
        Write-Warn "No backend/.env.example found. Create backend/.env and set MONGODB_URI and JWT_SECRET."
    }
} else {
    Write-Info "backend/.env already exists."
}

# Create frontend .env if missing
$frontendEnv = Join-Path $root 'frontend\.env'
if (-not (Test-Path $frontendEnv)) {
    $viteBase = "VITE_BASEURL=http://localhost:8000/api/v1"
    Set-Content -Path $frontendEnv -Value $viteBase -Encoding UTF8
    Write-Info "Created frontend/.env with default VITE_BASEURL=http://localhost:8000/api/v1"
} else {
    Write-Info "frontend/.env already exists."
}

# Run install-all.ps1
$installScript = Join-Path $root 'install-all.ps1'
if (Test-Path $installScript) {
    Write-Info "Running install-all.ps1 to install npm dependencies across the workspace..."
    powershell -ExecutionPolicy Bypass -File $installScript
} else {
    Write-Err "install-all.ps1 not found. Run npm install in each project manually."
}

Write-Info "\nBootstrap finished. Next steps:"
Write-Host "  1) Start backend: `cd backend; npm run dev` (ensure backend/.env contains MONGODB_URI and JWT_SECRET)"
Write-Host "  2) Start frontend: `cd frontend; npm run dev` (frontend/.env has VITE_BASEURL)"
Write-Host "  3) Optionally seed data: see backend/scripts/seed-user.js or backend/scripts/seed-user.js"

Write-Info "Done."
