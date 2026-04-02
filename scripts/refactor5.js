const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import ArticlesManager'));
lines.splice(importIdx + 1, 0, 'import ProjectsManager from "./components/ProjectsManager";');

// Find projects rendering section
const projSectionStart = lines.findIndex(l => l.trim() === "{/* ===== PROJECTS MANAGER ===== */}");
if (projSectionStart > -1) {
  const projIfStart = projSectionStart + 1; 
  
  // Find the closing )} for projects section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== QUIZZES MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'projects' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <ProjectsManager />
          </div>
        )}`;
    
    lines.splice(projIfStart, blockEnd - projIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored ProjectsManager in page.tsx');
