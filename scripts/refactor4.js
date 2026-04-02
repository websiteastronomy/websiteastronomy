const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
let lines = content.split('\n');

// Import
const importIdx = lines.findIndex(l => l.includes('import OutreachManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import ArticlesManager from "./components/ArticlesManager";');
}

// Replace code block
const sectionStart = lines.findIndex(l => l.trim() === "{/* ===== ARTICLES MANAGER ===== */}");
if (sectionStart > -1) {
  const ifStart = sectionStart + 1; 
  
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== PROJECTS MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    const newBlock = `        {activeTab === 'articles' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <ArticlesManager />
          </div>
        )}`;
    
    lines.splice(ifStart, blockEnd - ifStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored ArticlesManager in page.tsx');
