const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import MembersManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import NightSkyManager from "./components/NightSkyManager";');
}

// Find section
const nsSectionStart = lines.findIndex(l => l.trim() === "{/* ===== NIGHT SKY MANAGER ===== */}");
if (nsSectionStart > -1) {
  const nsIfStart = nsSectionStart + 1; 
  
  // Find the closing )} for night sky section
  // It's the end of the tabs wrapper
  const targetSectionStart = lines.findIndex((l, idx) => idx > nsIfStart && l.trim() === "</div>");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'night-sky' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <NightSkyManager />
          </div>
        )}`;
    
    lines.splice(nsIfStart, blockEnd - nsIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored NightSkyManager in page.tsx');
