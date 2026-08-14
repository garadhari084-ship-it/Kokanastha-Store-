const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* DELIVERY PARTNER`;

const replaceStr = `          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>
        </div>
      </div>

      {/* DELIVERY PARTNER`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
