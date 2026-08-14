const fs = require('fs');
const file = 'src/components/DeliveryModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}`;

const replaceStr = `          </tbody>
        </table>
      </div>
      )}

      {/* Confirmation Modal */}`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
