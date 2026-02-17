const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\CatalogHub.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

// Replace the range from line 1467 (index 1466) to 1481 (index 1480).
const start = 1466;
const end = 1480;

const top = content.slice(0, start);
const bottom = content.slice(end + 1);

const middle = [
    '                                        ) : (',
    '                                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>',
    '                                                <Layers size={100} />',
    '                                            </div>',
    '                                        )}',
    '                                    </div>',
    '                                </React.Fragment>',
    '                            )}'
];

const newContent = [...top, ...middle, ...bottom].join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully repaired the ternary block in CatalogHub.tsx');
