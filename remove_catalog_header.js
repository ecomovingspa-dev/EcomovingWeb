const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\ProductCatalog.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

const start = 224; // line 225
const end = 227;   // line 228

content.splice(start, end - start + 1);

fs.writeFileSync(filePath, content.join('\n'), 'utf8');
console.log('Successfully removed catalog-header from ProductCatalog.tsx');
