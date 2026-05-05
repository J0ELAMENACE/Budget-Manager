# ─────────────────────────────────────────────────────────────
#  Budget Manager — Installation Windows
#  Depuis le dossier du projet :
#  powershell -ExecutionPolicy Bypass -File install.ps1
# ─────────────────────────────────────────────────────────────

function Ok   { param($t) Write-Host "  v $t" -ForegroundColor Green }
function Info { param($t) Write-Host "  > $t" -ForegroundColor Cyan }
function Err  { param($t) Write-Host "  x $t" -ForegroundColor Red; Read-Host "Entree pour fermer"; exit 1 }

Clear-Host
Write-Host ""
Write-Host "  Budget Manager -- Installation" -ForegroundColor White
Write-Host "  --------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Verifier qu'on est dans le bon dossier
if (-not (Test-Path "package.json")) {
    Err "Lance ce script depuis la racine du projet (la ou se trouve package.json)."
}

# Node.js
Info "Verification de Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js n'est pas installe. Installe-le depuis https://nodejs.org (version 18+) puis relance ce script."
}
$v = (node --version) -replace "v",""
$major = [int]($v.Split(".")[0])
if ($major -lt 18) { Err "Node.js $v detecte — version 18+ requise. Mets a jour depuis https://nodejs.org" }
Ok "Node.js $v"

# npm install
Info "Installation des dependances npm..."
npm install
if ($LASTEXITCODE -ne 0) { Err "Echec de npm install." }
Ok "Dependances installees."

# Build Windows
Info "Build de l'application Windows..."
npm run dist:win
if ($LASTEXITCODE -ne 0) { Err "Echec du build." }
Ok "Build termine."

# Trouver l'exe
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
