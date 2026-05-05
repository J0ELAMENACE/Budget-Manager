# ─────────────────────────────────────────────────────────────
#  Budget Manager — Script de push GitHub
#  Usage : .\push.ps1 [-Message "mon message de commit"]
# ─────────────────────────────────────────────────────────────

param(
    [string]$Message = "update"
)

# ── Config ────────────────────────────────────────────────────
$REPO_URL  = "https://github.com/J0ELAMENACE/Budget-Manager.git"
$BRANCH    = "main"

# ── Couleurs ──────────────────────────────────────────────────
function Info  { param($t) Write-Host "  $t" -ForegroundColor Cyan }
function Ok    { param($t) Write-Host "  $t" -ForegroundColor Green }
function Warn  { param($t) Write-Host "  $t" -ForegroundColor Yellow }
function Err   { param($t) Write-Host "  $t" -ForegroundColor Red }

Write-Host ""
Write-Host "  Budget Manager — Push GitHub" -ForegroundColor White
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Vérifier qu'on est dans le bon dossier ────────────────────
if (-not (Test-Path "package.json")) {
    Err "package.json introuvable. Lance ce script depuis la racine du projet."
    exit 1
}

# ── Init git si nécessaire ────────────────────────────────────
if (-not (Test-Path ".git")) {
    Info "Initialisation du dépôt git..."
    git init
    git branch -M $BRANCH
    git remote add origin $REPO_URL
    Ok "Dépôt initialisé."
} else {
    # Vérifier que le remote est bien configuré
    $remotes = git remote
    if ($remotes -notcontains "origin") {
        Info "Ajout du remote origin..."
        git remote add origin $REPO_URL
    }
}

# ── Statut ────────────────────────────────────────────────────
Info "Fichiers modifiés :"
git status --short
Write-Host ""

# ── Staging ───────────────────────────────────────────────────
Info "Ajout de tous les fichiers..."
git add .

# ── Commit ────────────────────────────────────────────────────
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$fullMessage = "$Message ($timestamp)"

Info "Commit : $fullMessage"
git commit -m $fullMessage

if ($LASTEXITCODE -ne 0) {
    Warn "Rien à commiter ou erreur de commit."
    exit 0
}

# ── Push ──────────────────────────────────────────────────────
Info "Push vers $REPO_URL ($BRANCH)..."
git push -u origin $BRANCH

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Ok "Push réussi."
    Write-Host ""
} else {
    Write-Host ""
    Err "Erreur lors du push. Vérifie tes credentials ou l'URL du repo."
    Write-Host ""
    exit 1
}
