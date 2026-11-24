<# 
.SYNOPSIS
    Automated production deployment for Malaika Nest
.DESCRIPTION
    Run from your local Windows machine (where ~/.ssh/MalaikaNestKey exists)
.USAGE
    .\deploy-to-vm.ps1 [-CreateSuperuser]
#>

param(
    [switch]$CreateSuperuser
)

$ErrorActionPreference = "Stop"

# Configuration
$vmUser = "mohameddosho20"
$vmIp = "104.154.161.10"
$vmDir = "/var/www/malaikanest"
$sshKey = "$env:USERPROFILE\.ssh\MalaikaNestKey"
$createSuperuserFlag = if ($CreateSuperuser) { "--create-superuser" } else { "" }

# Colors
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Cyan
$Red = [ConsoleColor]::Red
$Gray = [ConsoleColor]::DarkGray

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [deploy] $msg" -ForegroundColor $Blue }
function Success($msg) { Write-Host "[✓] $msg" -ForegroundColor $Green }
function Warn($msg) { Write-Host "[!] $msg" -ForegroundColor $Yellow }
function Error($msg) { Write-Host "[✗] $msg" -ForegroundColor $Red; exit 1 }

# Pre-flight checks
if (-not (Test-Path $sshKey)) { Error "SSH key not found: $sshKey" }
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Error "ssh not installed (install OpenSSH Client)" }

Log "Connecting to $vmUser@$vmIp..."

# Build remote command
$remoteCmd = @"
set -euo pipefail
cd $vmDir

echo '=== Adding ADMIN_AUTHORIZED_EMAILS to .env ==='
grep -q '^ADMIN_AUTHORIZED_EMAILS=' .env 2>/dev/null || echo 'ADMIN_AUTHORIZED_EMAILS=admin@malaikanest.com,owner@malaikanest.com' >> .env
echo 'ADMIN_AUTHORIZED_EMAILS set'

echo '=== Pulling latest images ==='
docker compose pull

echo '=== Restarting services ==='
docker compose up -d

echo '=== Waiting for backend to be healthy ==='
sleep 5
for i in {1..12}; do
  if docker compose exec -T backend python manage.py check --deploy 2>/dev/null | grep -q 'System check identified no issues'; then
    echo 'Backend healthy'
    break
  fi
  sleep 5
done

echo '=== Running migrations (TOTP tables) ==='
docker compose exec -T backend python manage.py migrate

if [[ "$createSuperuserFlag" == "--create-superuser" ]]; then
  echo '=== Creating superuser ==='
  docker compose exec -T backend python manage.py createsuperuser --email admin@malaikanest.com --username admin --noinput || true
fi

echo '=== Verification ==='
docker compose ps
echo '--- Backend logs (last 30 lines) ---'
docker compose logs backend --tail=30
"@

# Execute via SSH
try {
    ssh -i $sshKey -o StrictHostKeyChecking=accept-new "$vmUser@$vmIp" $remoteCmd
    Success "Deployment complete!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Visit https://malaikanest.com/manage-store/"
    Write-Host "  2. Log in → Two Factor Authentication → TOTP Device → Add device for each admin"
    Write-Host "  3. Scan QR code with authenticator app"
    Write-Host "  4. Place test order → verify email templates render correctly"
} catch {
    Error "SSH deployment failed: $_"
}