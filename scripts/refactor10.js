const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import SettingsManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import MembersManager from "./components/MembersManager";');
}

// Find section
const memSectionStart = lines.findIndex(l => l.trim() === "{/* ===== MEMBERS MANAGER ===== */}");
if (memSectionStart > -1) {
  const memIfStart = memSectionStart + 1; 
  
  // Find the closing )} for members section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== NIGHT SKY MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'members' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <MembersManager />
          </div>
        )}`;
    
    lines.splice(memIfStart, blockEnd - memIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored MembersManager in page.tsx');
