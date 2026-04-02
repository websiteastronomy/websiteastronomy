const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import ProjectsManager'));
if (importIdx !== -1) {
  lines.splice(importIdx + 1, 0, 'import QuizzesManager from "./components/QuizzesManager";');
}

// Find quizzes rendering section
const quizSectionStart = lines.findIndex(l => l.trim() === "{/* ===== QUIZZES MANAGER ===== */}");
if (quizSectionStart > -1) {
  const quizIfStart = quizSectionStart + 1; 
  
  // Find the closing )} for quizzes section
  const targetSectionStart = lines.findIndex(l => l.trim() === "{/* ===== GALLERY MANAGER ===== */}");
  
  if (targetSectionStart > -1) {
    const blockEnd = targetSectionStart - 1; 
    
    // Replace the inner block
    const newBlock = `        {activeTab === 'quizzes' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <QuizzesManager />
          </div>
        )}`;
    
    lines.splice(quizIfStart, blockEnd - quizIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored QuizzesManager in page.tsx');
