const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import QuizzesManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import GalleryManager from "./components/GalleryManager";');
}

// Find gallery rendering section
const galSectionStart = lines.findIndex(l => l.trim() === "{/* ===== GALLERY / MEDIA MANAGER ===== */}");
if (galSectionStart > -1) {
  const galIfStart = galSectionStart + 1; 
  
  // Find the closing )} for gallery section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== ACHIEVEMENTS MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'gallery' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <GalleryManager />
          </div>
        )}`;
    
    lines.splice(galIfStart, blockEnd - galIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored GalleryManager in page.tsx');
