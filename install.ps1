# ─────────────────────────────────────────────────────────────
#  Budget Manager - Installateur Windows
#  Usage : powershell -ExecutionPolicy Bypass -File install.ps1
# ─────────────────────────────────────────────────────────────

function Ok   { param($t) Write-Host "  v $t" -ForegroundColor Green }
function Info { param($t) Write-Host "  > $t" -ForegroundColor Cyan }
function Err  { param($t) Write-Host "  x $t" -ForegroundColor Red; Read-Host "Entree pour fermer"; exit 1 }

Clear-Host
Write-Host ""
Write-Host "  Budget Manager -- Installation" -ForegroundColor White
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path "package.json")) {
    Err "Lance ce script depuis la racine du projet."
}

Info "Verification de Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js non installe. Va sur https://nodejs.org (version 18+) puis relance ce script."
}
$v = (node --version) -replace "v",""
$major = [int]($v.Split(".")[0])
if ($major -lt 18) {
    Err "Node.js $v detecte, version 18+ requise. Mets a jour depuis https://nodejs.org"
}
Ok "Node.js $v"

Info "Installation des dependances..."
npm install
if ($LASTEXITCODE -ne 0) { Err "Echec de npm install." }
Ok "Dependances installees."

Info "Build de l'application Windows..."
npm run dist:win
if ($LASTEXITCODE -ne 0) { Err "Echec du build." }
Ok "Build termine."

$setup = Get-ChildItem "dist-electron" -Filter "*Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
$exe   = Get-ChildItem "dist-electron" -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
$target = if ($setup) { $setup.FullName } else { $exe.FullName }

Write-Host ""
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Ok "Pret ! Lance l'application :"
Write-Host ""
if ($target) {
    Write-Host "  $target" -ForegroundColor White
} else {
    Write-Host "  dist-electron\" -ForegroundColor White
}
Write-Host ""
Read-Host "  Appuie sur Entree pour fermer"
