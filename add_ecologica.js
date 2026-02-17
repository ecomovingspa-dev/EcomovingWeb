const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\CatalogHub.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

const targetLineIndex = content.findIndex(line => line.includes('const [customCategories, setCustomCategories] = useState'));

if (targetLineIndex !== -1) {
    console.log('Found categories line. Updating to final requested state...');
    // We want to replace the current categories with the new ones.
    content[targetLineIndex] = "    const [customCategories, setCustomCategories] = useState<string[]>(['MUG', 'BOTELLAS', 'CUADERNOS Y LIBRETAS', 'MOCHILAS Y BOLSOS', 'BOLÍGRAFOS', 'ECOLÓGICA']);";
    fs.writeFileSync(filePath, content.join('\n'), 'utf8');
    console.log('Successfully updated categories to: MUG, BOTELLAS, CUADERNOS Y LIBRETAS, MOCHILAS Y BOLSOS, BOLÍGRAFOS, ECOLÓGICA');
} else {
    console.log('Could not find categories line.');
}
