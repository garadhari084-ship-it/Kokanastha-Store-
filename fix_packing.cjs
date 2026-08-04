const fs = require('fs');
let content = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf8');

const correctEnd = `
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {filteredQueue.length === 0 && (
        <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 space-y-3">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto">
            <QrCode size={28} className="text-slate-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">No Pending Orders</h4>
            <p className="text-[11px] max-w-sm mx-auto text-slate-500">All sales orders are packed and verified! New pending sales orders will automatically appear in this queue.</p>
          </div>
        </div>
      )}
      </div>
      ) : (
`;

// find the exact place to splice.
const marker = '                              <Scan size={13} />\n                              <span>Open Station</span>\n                            </button>\n                          </td>\n                        </tr>\n                      );';

const index = content.lastIndexOf(marker);
if (index === -1) {
    console.error('marker not found');
    process.exit(1);
}

const restIndex = content.indexOf('        /* ========================================================================= */\n        /* PAGE VIEW C: LIVE PRODUCT STOCK', index);

if (restIndex === -1) {
    console.error('rest marker not found');
    process.exit(1);
}

const newContent = content.substring(0, index + marker.length) + correctEnd + content.substring(restIndex);
fs.writeFileSync('src/components/PackingVerificationModule.tsx', newContent);
console.log('Fixed');
