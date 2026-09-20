const fs = require('fs');
const path = require('path');

const map = require('./uploaded-images-map.json');

// Files to update
const targetFiles = [
  'src/data/servoProductsData.ts',
  'src/utils/image.ts',
  'src/components/pages/ProductsPage.tsx',
  'src/components/pages/CategoriesPage.tsx',
  'src/components/pages/ServoStabilizersShowcase.tsx',
  'src/components/layout/Navigation.tsx',
  'src/context/CompanySettingsContext.tsx',
  'src/components/portal/CompanySettingsTab.tsx',
  'lib/db.ts',
  'app/api/settings/route.ts'
];

const logoUrl = map['logo.png'];
const defaultFallbackUrl = map['Oil Cooled Stabilizer.png'];

console.log('Using logoUrl:', logoUrl);
console.log('Using defaultFallbackUrl:', defaultFallbackUrl);

// Key replacements:
const replacements = [
  // Fallback stabilizer image
  { from: /['"]\/Images\/Oil Cooled Stabilizer\.png['"]/g, to: `'${defaultFallbackUrl}'` },
  { from: /['"]Images\/Oil Cooled Stabilizer\.png['"]/g, to: `'${defaultFallbackUrl}'` },

  // Servo products images
  { from: /['"]\/?images\/cvt\.png['"]/g, to: `'${map['cvt.png']}'` },
  { from: /['"]\/?images\/oil_cooled\.jpeg['"]/g, to: `'${map['oil_cooled.jpeg']}'` },
  { from: /['"]\/?images\/oil_3\.png['"]/g, to: `'${map['oil_3.png']}'` },
  { from: /['"]\/?images\/3_0\.png['"]/g, to: `'${map['3_0.png']}'` },
  { from: /['"]\/?images\/3_1\.png['"]/g, to: `'${map['3_1.png']}'` },
  { from: /['"]\/?images\/3_2\.png['"]/g, to: `'${map['3_2.png']}'` },
  { from: /['"]\/?images\/3_3\.png['"]/g, to: `'${map['3_3.png']}'` },
  { from: /['"]\/?images\/3_5\.png['"]/g, to: `'${map['3_5.png']}'` },
  { from: /['"]\/?images\/3_6\.png['"]/g, to: `'${map['3_6.png']}'` },
  { from: /['"]\/?images\/1_1\.png['"]/g, to: `'${map['1_1.png']}'` },
  { from: /['"]\/?images\/1_2\.png['"]/g, to: `'${map['1_2.png']}'` },
  { from: /['"]\/?images\/1_3\.png['"]/g, to: `'${map['1_3.png']}'` },

  // Logo replacements
  { from: /['"]\/logo\.png['"]/g, to: `'${logoUrl}'` },
  { from: /src="\/logo\.png"/g, to: `src="${logoUrl}"` },
  { from: /placeholder="\/logo\.png"/g, to: `placeholder="${logoUrl}"` },
  { from: /value=\{settings\.logo \|\| '\/logo\.png'\}/g, to: `value={settings.logo || '${logoUrl}'}` }
];

for (const relPath of targetFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  let count = 0;

  for (const rep of replacements) {
    const matches = content.match(rep.from);
    if (matches) {
      count += matches.length;
      content = content.replace(rep.from, rep.to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${relPath} (${count} occurrences replaced).`);
  } else {
    console.log(`No changes needed in ${relPath}.`);
  }
}
