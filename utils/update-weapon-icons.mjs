import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const talentIconMap = {
  "Einhandklingenwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/sword-hilt.svg",
  "Zweihandklingenwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/two-handed-sword.svg",
  "Einhandhiebwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/spiked-mace.svg",
  "Zweihandhiebwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/war-axe.svg",
  "Handgemengewaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/plain-dagger.svg",
  "Infanteriewaffen und Speere": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/glaive.svg",
  "Bögen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/bow-arrow.svg",
  "Armbrüste": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/crossbow.svg",
  "Kurzfeuerwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/crossed-pistols.svg",
  "Langfeuerwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/musket.svg",
  "Schilde": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/round-shield.svg",
  "Kurze Wurfwaffen": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/thrown-daggers.svg",
  "Wurfspeere": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/thrown-spear.svg",
  "Diskusse": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/chakram.svg",
  "Schleudern": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/sling.svg",
  "Blasrohre": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/bamboo.svg",
  "Unbewaffnet": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/fist.svg",
  "Tierkunde": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/hound.svg",
  "Reiten": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/horse-head.svg",
  "Lanzenreiten": "modules/ilaris-alternative-actor-sheet/assets/icons/weapons/cavalry.svg"
};

const weaponsDir = path.join(__dirname, '..', 'packs', 'nenneke_regeln-waffen', '_source');

console.log('Updating weapon icons...\n');

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

const files = fs.readdirSync(weaponsDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  try {
    const filePath = path.join(weaponsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const weapon = JSON.parse(content);
    
    const talent = weapon.system?.talent;
    
    if (!talent) {
      console.log(`⚠ ${weapon.name} - No talent found`);
      skippedCount++;
      continue;
    }
    
    if (talentIconMap[talent]) {
      const newIcon = talentIconMap[talent];
      const oldIcon = weapon.img;
      
      if (oldIcon !== newIcon) {
        weapon.img = newIcon;
        
        // Write back with proper formatting
        fs.writeFileSync(filePath, JSON.stringify(weapon, null, 2) + '\n', 'utf8');
        
        console.log(`✓ ${weapon.name} (${talent})`);
        updatedCount++;
      } else {
        console.log(`- ${weapon.name} (already correct)`);
        skippedCount++;
      }
    } else {
      console.log(`⚠ ${weapon.name} - Unknown talent: ${talent}`);
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
