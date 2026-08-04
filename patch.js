const fs = require('fs');
const content = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8');
const target = `                </table>
              </div>
            </div>
          )}
          {filteredQueue.length === 0 && (`.replace(/\r\n/g, '\n');
const replacement = `                </table>
              </div>
            </div>
          )}
            </div>
          ))}
          {filteredQueue.length === 0 && (`.replace(/\r\n/g, '\n');
fs.writeFileSync('src/components/PackingVerificationModule.tsx', content.replace(target, replacement));
console.log('patched');
