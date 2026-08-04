const fs = require('fs');
let lines = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8').split('\n');
lines.splice(1046, 0, ...`                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
      {filteredQueue.length === 0 && (
        <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 space-y-3">`.split('\n'));
fs.writeFileSync('src/components/PackingVerificationModule.tsx', lines.join('\n'));
