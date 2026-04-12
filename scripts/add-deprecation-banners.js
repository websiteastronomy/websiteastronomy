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
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (missing):', filePath);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Strip duplicate imports from prior broken scripts
  content = content.replace(/import DeprecationBanner from "@\/components\/DeprecationBanner";\n/g, "");
  content = content.replace(/import DeprecationBanner from '@\/components\/DeprecationBanner';\n/g, "");

  // Make sure it doesn't already have the component tag injected
  if (content.includes('<DeprecationBanner')) {
    console.log('SKIP (already injected):', filePath);
    continue;
  }

  content = "import DeprecationBanner from '@/components/DeprecationBanner';\n" + content;

  // We know the wrapper renders: return <SomePage />;
  // We want to turn it into: return (\n <>\n  <DeprecationBanner ... />\n  <SomePage />\n </>\n);
  content = content.replace(/return\s+</, 'return (\n    <>\n      <DeprecationBanner currentPath="/app/' + dir + '" newPath="/admin?tab=' + dir + '" />\n      <');
  content = content.replace(/;\s*}\s*$/, '\n    </>\n  );\n}\n');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed:', filePath);
}
