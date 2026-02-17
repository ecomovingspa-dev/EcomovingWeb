const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\CatalogHub.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

// We want to insert the gallery grid after the header div ends.
// Current line 1526 is index 1525 (the </div> for the gap:20px div)

// We also need to close the header div (1449) and the outer scroll div (1448).

const top = content.slice(0, 1527);
const bottom = content.slice(1527);

const middle = [
    '                                        </div>', // Closes header div (1449)
    '',
    '                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "25px" }}>',
    '                                            {galleryImages.map((src, index) => (',
    '                                                <div key={index} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "#111" }}>',
    '                                                    <img src={src} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />',
    '                                                    <button',
    '                                                        onClick={() => handleRemoveGalleryImage(index)}',
    '                                                        style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}',
    '                                                    >',
    '                                                        <X size={16} />',
    '                                                    </button>',
    '                                                </div>',
    '                                            ))}',
    '                                            {galleryImages.length === 0 && !uploadingGallery && (',
    '                                                <div style={{ gridColumn: "1 / -1", padding: "100px", textAlign: "center", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: "12px", color: "#444" }}>',
    '                                                    <Plus size={60} style={{ marginBottom: "20px", opacity: 0.2 }} />',
    '                                                    <p style={{ letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px" }}>No hay imágenes en esta galería</p>',
    '                                                </div>',
    '                                            )}',
    '                                        </div>',
    '                                    </div>' // Closes outer scroll div (1448)
];

const newContent = [...top, ...middle, ...bottom].join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully applied v3 fix to CatalogHub.tsx');
