const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryModule.tsx', 'utf8');

const target = `            </button>
          ))}
        </div>
        <div className="flex-1 max-w-md flex items-center`;

const rep = `            </button>
          ))}
        </div>
        </div>
        <div className="flex-1 max-w-md flex items-center`;

content = content.replace(target, rep);

fs.writeFileSync('src/components/DeliveryModule.tsx', content);
console.log('fixed missing closing tag');
