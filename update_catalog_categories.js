const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\ProductCatalog.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

const newCategories = "['Todos', 'Mug', 'Botellas', 'Cuadernos y Libretas', 'Mochilas y Bolsos', 'Bolígrafos', 'Ecológica']";

for (let i = 0; i < content.length; i++) {
    if (content[i].includes("const categories = ['Todos',") || content[i].includes("{['Todos', 'Mug', 'Botellas',")) {
        if (content[i].includes("const categories =")) {
            content[i] = `    const categories = ${newCategories};`;
        } else {
            content[i] = content[i].replace(/\[.*?\]/, newCategories);
        }
    }
}

fs.writeFileSync(filePath, content.join('\n'), 'utf8');
console.log('Successfully updated categories in ProductCatalog.tsx');
