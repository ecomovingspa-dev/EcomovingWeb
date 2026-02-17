const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\CatalogHub.tsx';
const content = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 1419 is index 1418
// Line 1422 is index 1421

const top = content.slice(0, 1419);
const bottom = content.slice(1422);

const middle = [
    '                                                        </div>',
    '                                                    </div>',
    '                                                </div>',
    '                                            </div>',
    '                                        ) : (',
    '                                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>',
    '                                                <Layers size={100} />',
    '                                            </div>',
    '                                        )}',
    '                                    </React.Fragment>',
    '                                )}',
    '',
    '                            {activeTab === "gallery" && (',
    '                                <React.Fragment>',
    '                                    <div className="custom-scroll" style={{ borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto", padding: "32px 40px", backgroundColor: "rgba(0,0,0,0.2)" }}>',
    '                                        <h3 style={{ color: "var(--accent-gold)", fontSize: "11px", fontWeight: "900", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "30px" }}>SECCIONES</h3>',
    '                                        <div style={{ display: "grid", gap: "10px" }}>',
    '                                            {["mugs", "botellas", "mochilas", "libretas", "ecologicos", "bolsas"].map(sec => (',
    '                                                <button',
    '                                                    key={sec}',
    '                                                    onClick={() => setSelectedGallerySection(sec)}',
    '                                                    style={{ textAlign: "left", padding: "15px 20px", background: selectedGallerySection === sec ? "rgba(0, 212, 189, 0.05)" : "transparent", border: "1px solid", borderColor: selectedGallerySection === sec ? "var(--accent-turquoise)" : "transparent", color: selectedGallerySection === sec ? "var(--accent-turquoise)" : "#555", borderRadius: "4px", textTransform: "uppercase", fontSize: "11px", fontWeight: "800", cursor: "pointer", letterSpacing: "2px" }}',
    '                                                >',
    '                                                    {sec}',
    '                                                </button>',
    '                                            ))}',
    '                                        </div>',
    '                                    </div>',
    '                                    <div className="custom-scroll" style={{ padding: "60px", overflowY: "auto", backgroundColor: "#050505" }}>',
    '                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px" }}>',
    '                                            <h2 style={{ color: "white", fontFamily: "var(--font-heading)", fontSize: "32px", margin: 0, letterSpacing: "4px", textTransform: "uppercase" }}>',
    '                                                GESTIÓNDE <span style={{ color: "var(--accent-gold)" }}>GALERÍAS</span>',
    '                                            </h2>',
    '                                            <div style={{ display: "flex", gap: "20px" }}>'
];

const newContent = [...top, ...middle, ...bottom].join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully fixed CatalogHub.tsx structure');
