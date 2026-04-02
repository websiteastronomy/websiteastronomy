const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import GalleryManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import AchievementsManager from "./components/AchievementsManager";');
}

// Find section
const achSectionStart = lines.findIndex(l => l.trim() === "{/* ===== ACHIEVEMENTS MANAGER ===== */}");
if (achSectionStart > -1) {
  const achIfStart = achSectionStart + 1; 
  
  // Find the closing )} for achievements section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== SITE SETTINGS ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'achievements' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <AchievementsManager />
          </div>
        )}`;
    
    lines.splice(achIfStart, blockEnd - achIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored AchievementsManager in page.tsx');
