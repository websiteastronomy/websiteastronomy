const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import AchievementsManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import SettingsManager from "./components/SettingsManager";');
}

// Find section
const setSectionStart = lines.findIndex(l => l.trim() === "{/* ===== SITE SETTINGS ===== */}");
if (setSectionStart > -1) {
  const setIfStart = setSectionStart + 1; 
  
  // Find the closing )} for settings section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== MEMBERS MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'settings' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <SettingsManager />
          </div>
        )}`;
    
    lines.splice(setIfStart, blockEnd - setIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored SettingsManager in page.tsx');
