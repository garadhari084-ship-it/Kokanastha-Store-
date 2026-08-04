const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerModule.tsx', 'utf8');

const regex = /<Mail size=\{10\} \/> \{cust\.email\}<\/span>\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/td>/m;
const match = content.match(regex);
if (match) {
  content = content.replace(match[0], `<Mail size={10} /> {cust.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>`);
  fs.writeFileSync('src/components/CustomerModule.tsx', content);
}
