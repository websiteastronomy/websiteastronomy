const fs = require('fs');
const path = require('path');

const dirs = [
  'achievements',
  'articles',
  'documentation',
  'events',
  'finance',
  'forms',
  'members',
  'night-sky',
  'observations',
  'outreach',
  'quizzes',
  'site-settings',
  'storage',
  'system-control',
];

for (const dir of dirs) {
  const filePath = path.join('src', 'app', 'app', dir, 'page.tsx');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove ALL existing DeprecationBanner imports
  content = content.replace(/import DeprecationBanner from [\'\"]@\/components\/DeprecationBanner[\'\"];?\s*\n/g, '');

  let hasUseClient = false;
  // Look for any use client pragma
  if (content.match(/([\'\"]use client[\'\"];?\s*\n)/)) {
    hasUseClient = true;
    content = content.replace(/([\'\"]use client[\'\"];?\s*\n)/g, '');
  }

  let finalContent = '';
  if (hasUseClient) {
    finalContent += '"use client";\n';
  }
  finalContent += 'import DeprecationBanner from "@/components/DeprecationBanner";\n';
  finalContent += content;

  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log('Fixed', filePath);
}
