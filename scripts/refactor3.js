const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import ObservationsManager'));
lines.splice(importIdx + 1, 0, 'import OutreachManager from "./components/OutreachManager";');

// Find outreach rendering section
const outSectionStart = lines.findIndex(l => l.trim() === "{/* ===== OUTREACH MANAGER ===== */}");
if (outSectionStart > -1) {
  const outIfStart = outSectionStart + 1; 
  
  // Find the closing )} for outreach section
  // It's followed by {/* ===== ARTICLES MANAGER ===== */}
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== ARTICLES MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'outreach' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <OutreachManager />
          </div>
        )}`;
    
    lines.splice(outIfStart, blockEnd - outIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored OutreachManager in page.tsx');
