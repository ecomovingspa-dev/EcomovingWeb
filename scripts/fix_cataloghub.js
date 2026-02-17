
const fs = require('fs');
const path = 'src/components/CatalogHub.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. DATA FIX: Plural and Correct Categories
const correctCategories = [
    'ECOLÓGICOS',
    'BOTELLAS, MUGS Y TAZAS',
    'CUADERNOS, LIBRETAS Y MEMO SET',
    'MOCHILAS, BOLSOS Y MORRALES',
    'BOLÍGRAFOS',
    'ACCESORIOS'
];

content = content.replace(/const \[customCategories, setCustomCategories\] = useState<string\[\]>\(\[.*?\]\);/,
    `const [customCategories, setCustomCategories] = useState<string[]>(['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS']);`);

content = content.replace(/const specialCategories = \[.*?\];/,
    `const specialCategories = ['ECOLÓGICOS', 'BOTELLAS, MUGS Y TAZAS', 'CUADERNOS, LIBRETAS Y MEMO SET', 'MOCHILAS, BOLSOS Y MORRALES', 'BOLÍGRAFOS', 'ACCESORIOS'];`);

// 2. LAYOUT FIX: More space for categories
content = content.replace(/gridTemplateColumns: '380px 1fr'/g, "gridTemplateColumns: '280px 1fr'");
content = content.replace(/gridTemplateColumns: '240px 1fr'/g, "gridTemplateColumns: '240px 1fr'"); // Already reduced for NEW product

// 3. STYLE FIX: Premium Pillars in Detail/Add Form (Areas 3 & 4)
// I'll update the style object to be more "Wow"
const luxuryButtonStyle = `{
                                                                                            padding: '12px 20px',
                                                                                            borderRadius: '4px',
                                                                                            border: \`1px solid \$\{isSelected ? 'var(--accent-turquoise)' : 'rgba(255,255,255,0.03)'\}\`,
                                                                                            backgroundColor: isSelected ? 'rgba(0,212,189,0.1)' : 'rgba(255,255,255,0.01)',
                                                                                            color: isSelected ? 'var(--accent-turquoise)' : '#888',
                                                                                            fontSize: '11px',
                                                                                            fontWeight: '700',
                                                                                            letterSpacing: '1px',
                                                                                            textTransform: 'uppercase',
                                                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                                            cursor: 'pointer',
                                                                                            textAlign: 'center',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            minWidth: '100px',
                                                                                            width: 'calc(50% - 10px)' // Force two columns if container allows
                                                                                        }`;

// Target the style block for detail categories
content = content.replace(/style=\{\{\s+padding: '10px 20px',[\s\S]+?cursor: 'pointer'\s+\}\}/g, `style={${luxuryButtonStyle}}`);

// 4. STYLE FIX: Horizontal Bar (Area 2)
content = content.replace(/padding: '10px 22px',[\s\S]+?borderRadius: '30px',[\s\S]+?textTransform: 'uppercase'/,
    `padding: '11px 24px',
                                                    borderRadius: '4px',
                                                    border: \`1px solid \$\{selectedCategory === cat ? 'var(--accent-gold)' : 'rgba(255,255,255,0.03)'\}\`,
                                                    backgroundColor: selectedCategory === cat ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.01)',
                                                    color: selectedCategory === cat ? 'var(--accent-gold)' : '#777',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    letterSpacing: '1.5px',
                                                    textTransform: 'uppercase'`);

// 5. STYLE FIX: Dropdown (Area 1)
content = content.replace(/padding: '14px 25px',[\s\S]+?backgroundColor: selectedCategory === cat \? 'rgba\(0,212,189,0\.05\)' : 'transparent'/,
    `padding: '15px 25px', 
                                                                textAlign: 'left', 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                color: selectedCategory === cat ? 'var(--accent-turquoise)' : '#888', 
                                                                fontSize: '12px', 
                                                                fontWeight: '600', 
                                                                cursor: 'pointer', 
                                                                borderBottom: '1px solid rgba(255,255,255,0.03)', 
                                                                textTransform: 'uppercase',
                                                                transition: 'all 0.2s',
                                                                backgroundColor: selectedCategory === cat ? 'rgba(0,212,189,0.08)' : 'transparent'`);

// 6. ENCODING CLEANUP
content = content.replace(/COÌ DIGO/g, 'CÓDIGO');
content = content.replace(/CATEGORIAÍ/g, 'CATEGORÍAS');
content = content.replace(/TODA LA CATEGORÍA/g, 'TODAS LAS CATEGORÍAS');
content = content.replace(/BIBLIOTECA DE ACTIVO/g, 'BIBLIOTECA DE ACTIVOS');

fs.writeFileSync(path, content, 'utf8');
console.log('Premium Harmonization v2 Applied.');
