const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');
code = code.replace(/<\/div                          <\/div>\n                        <\/td>\n                      <\/tr>\n                    \);\);\n/g, '</div>\n                          </div>\n                        </td>\n                      </tr>\n                    );\n');
fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
