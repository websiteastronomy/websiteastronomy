const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Find import spot
const importIdx = lines.findIndex(l => l.includes('import { subscribeToCollection'));
lines.splice(importIdx, 0, 'import EventsManager from "./components/EventsManager";');

// Find events rendering section
const eventsSectionStart = lines.findIndex(l => l.trim() === "{/* ===== EVENTS MANAGER ===== */}");
if (eventsSectionStart > -1) {
  const eventsIfStart = eventsSectionStart + 1; // {activeTab === 'events' && (
  
  // Find the closing )} for events section
  // It's followed by {/* ===== OBSERVATIONS MANAGER ===== */}
  const obsSectionStart = lines.findIndex(l => l.trim() === "{/* ===== OBSERVATIONS MANAGER ===== */}");
  
  if (obsSectionStart > -1) {
    const blockEnd = obsSectionStart - 1; 
    
    // Replace the inner block with <EventsManager />
    const newBlock = `        {activeTab === 'events' && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <EventsManager />
          </div>
        )}`;
    
    lines.splice(eventsIfStart, blockEnd - eventsIfStart + 1, newBlock);
  }
}

fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
console.log('Successfully refactored EventsManager in page.tsx');
