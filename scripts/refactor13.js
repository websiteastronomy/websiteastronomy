const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/admin/page.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// Replace the long overview block with <OverviewManager onNavigate={setActiveTab} />
const regex = /{\/\* ===== OVERVIEW ===== \*\/}[\s\S]*?{\/\* ===== EVENTS MANAGER ===== \*\/}/m;

const newBlock = `{/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <OverviewManager onNavigate={setActiveTab} />
        )}

        {/* ===== EVENTS MANAGER ===== */}`;

content = content.replace(regex, newBlock);

// Also we need to inject the import
content += `\nimport OverviewManager from "./components/OverviewManager";\n`;

fs.writeFileSync(targetPath, content, 'utf-8');
console.log('Successfully refactored OverviewManager in page.tsx');
