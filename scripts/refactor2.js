const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import EventsManager'));
lines.splice(importIdx + 1, 0, 'import ObservationsManager from "./components/ObservationsManager";');

// Find observations rendering section
const obsSectionStart = lines.findIndex(l => l.trim() === "{/* ===== OBSERVATIONS MANAGER ===== */}");
if (obsSectionStart > -1) {
  const obsIfStart = obsSectionStart + 1; 
  
  // Find the closing )} for observations section
  // It's followed by {/* ===== OUTREACH MANAGER ===== */}
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== OUTREACH MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block with <ObservationsManager />
    const newBlock = `        {activeTab === 'observations' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <ObservationsManager />
          </div>
        )}`;
    
    lines.splice(obsIfStart, blockEnd - obsIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored ObservationsManager in page.tsx');
