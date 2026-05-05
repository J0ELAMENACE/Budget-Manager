// ─────────────────────────────────────────────────────────────
//  Budget Manager — Générateur d'icônes
//  Convertit assets/icon.svg → assets/icon.png + assets/icon.ico
//  Usage : node scripts/generate-icons.js
// ─────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

async function main() {
  // Vérifier que sharp est installé
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('\n  sharp non installé. Installation...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: ROOT });
    sharp = require('sharp');
  }

  // Vérifier que png-to-ico est installé
  let pngToIco;
  try {
    pngToIco = require('png-to-ico');
  } catch {
    console.log('\n  png-to-ico non installé. Installation...');
    const { execSync } = require('child_process');
    execSync('npm install png-to-ico --save-dev', { stdio: 'inherit', cwd: ROOT });
    pngToIco = require('png-to-ico');
  }

  const svgPath = path.join(ASSETS, 'icon.svg');
  const pngPath = path.join(ASSETS, 'icon.png');
  const icoPath = path.join(ASSETS, 'icon.ico');

  if (!fs.existsSync(svgPath)) {
    console.error('  ✗ assets/icon.svg introuvable');
    process.exit(1);
  }

  console.log('\n  Budget Manager — Génération des icônes');
  console.log('  ──────────────────────────────────────\n');

  // ── PNG 512×512 ──────────────────────────────────────────
  process.stdout.write('  → Génération icon.png (512×512)...');
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(pngPath);
  console.log(' ✓');

  // ── ICO multi-tailles (256, 128, 64, 48, 32, 16) ─────────
  process.stdout.write('  → Génération icon.ico (multi-tailles)...');
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgPath).resize(size, size).png().toBuffer()
    )
  );
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(' ✓');

  console.log('\n  Fichiers générés :');
  console.log(`    assets/icon.svg`);
  console.log(`    assets/icon.png  (512×512)`);
  console.log(`    assets/icon.ico  (16/32/48/64/128/256px)`);
  console.log('\n  Tu peux maintenant builder l\'app avec npm run dist:win / dist:linux\n');
}

main().catch(err => {
  console.error('\n  ✗ Erreur :', err.message);
  process.exit(1);
});
