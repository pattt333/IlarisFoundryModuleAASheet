import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping von Fertigkeits-Namen zu Icon-Dateien
const fertigkeitIconMap = {
  "Klingenwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/crossed-sabres.svg",
  "Hiebwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/wood-club.svg",
  "Stangenwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/sharp-halberd.svg",
  "Handgemenge": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/mailed-fist.svg",
  "Wurfwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/thrown-knife.svg",
  "Schusswaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/archer.svg",
  "Feuerwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/gunshot.svg",
  "Athletik": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/sprint.svg",
  "Überlebensfertigkeiten": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/camping-tent.svg",
  "Sinnesschärfe": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/awareness.svg",
  "Autorität": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/king.svg",
  "Beeinflussung": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/conversation.svg",
  "Diplomatie": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/scroll-quill.svg",
  "Menschenkenntnis": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/thought-bubble.svg",
  "Bildung": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/secret-book.svg",
  "Derekunde": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/compass.svg",
  "Straßenkunde": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/hooded-figure.svg",
  "Arkane Künste": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/secret-book.svg",
  "Handwerk": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/anvil-impact.svg",
  "Phexisches Handwerk": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/lockpicks.svg",
  "Heilkunde": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/hand-bandage.svg",
  "Selbstbeherrschung": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/thought-bubble.svg",
  "Fortbewegungsmittel": "modules/ilaris-alternative-actor-sheet/assets/icons/fertigkeiten/ship-wheel.svg"
};

const fertigkeitenDir = path.join(__dirname, '..', 'packs', 'nenneke_regeln-fertigkeiten', '_source');

console.log('Updating skill icons...\n');

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

const files = fs.readdirSync(fertigkeitenDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  try {
    const filePath = path.join(fertigkeitenDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fertigkeit = JSON.parse(content);
    
    const name = fertigkeit.name;
    
    if (!name) {
      console.log(`⚠ ${file} - No name found`);
      skippedCount++;
      continue;
    }
    
    if (fertigkeitIconMap[name]) {
      const newIcon = fertigkeitIconMap[name];
      const oldIcon = fertigkeit.img;
      
      if (oldIcon !== newIcon) {
        fertigkeit.img = newIcon;
        
        // Write back with proper formatting
        fs.writeFileSync(filePath, JSON.stringify(fertigkeit, null, 2) + '\n', 'utf8');
        
        console.log(`✓ ${name}`);
        updatedCount++;
      } else {
        console.log(`- ${name} (already correct)`);
        skippedCount++;
      }
    } else {
      console.log(`⚠ ${name} - No icon mapping found`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`✗ ${file} - Error: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(40));
console.log(`Updated: ${updatedCount}`);
console.log(`Skipped: ${skippedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('='.repeat(40));
