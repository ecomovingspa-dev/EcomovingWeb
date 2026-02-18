const fs = require('fs');
const filePath = 'c:\\Users\\Mario\\Desktop\\EcomovingWeb\\src\\components\\CatalogHub.tsx';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Define the start and end markers of the block to replace
    const startMarker = '<div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px", alignItems: \'start\' }}>';
    // The block ends with </div> </div> </div> properly nested. 
    // But matching closing tags is hard. 
    // We know the block ends just before `)}` which closes the activeTab === "marketing" block loop?
    // No, it closes the ternary `!selectedProduct ? ... : ...`

    // Let's look for the start marker.
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        console.error('Start marker not found');
        process.exit(1);
    }

    // Find the end. The block ends with `</div>` indented at the same level as the start?
    // The start marker has indentation.
    // Let's find the closing `)}` of the ternary.
    // It should be `)}` followed by `</div>` and `</div>` and `</React.Fragment>`.

    // Let's search for the next `)}` after the start marker.
    // But there might be nested `)}`.
    // The `activeTab` block ends with:
    //                                             </div>
    //                                         </div>
    //                                     </React.Fragment>
    //                                 )
    //                             }

    // The ternary ends with:
    //                                 )}

    // Let's look for the specific indentation of `)}`?
    // Step 134 shows:
    // 2513:                                                 )}

    const endMarkerVal = '\n                                                )}';
    const endIndex = content.indexOf(endMarkerVal, startIndex);

    if (endIndex === -1) {
        console.error('End marker not found');
        process.exit(1);
    }

    // New content
    const newContent = `                                                    <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.2, border: "2px dashed #444", borderRadius: "12px" }}>
                                                        <Sparkles size={60} />
                                                        <p style={{ marginTop: "20px", letterSpacing: "2px", color: "#666" }}>SELECCIONA UN PRODUCTO Y PULSA "GENERAR"</p>
                                                    </div>`;

    // Replace
    const updatedContent = content.substring(0, startIndex) + newContent + content.substring(endIndex);

    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('Successfully replaced the old UI block.');

} catch (err) {
    console.error(err);
}
