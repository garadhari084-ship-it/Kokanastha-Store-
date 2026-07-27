const fs = require('fs');
let code = fs.readFileSync('src/components/PackingVerificationModule.tsx', 'utf-8');

code = code.replace(/import \{ Bike, Store,  PageHeader \} from '\.\/PageHeader';/, "import { PageHeader } from './PageHeader';");

// Check if lucide-react import already has them
if (!code.includes('Bike,')) {
    code = code.replace(/import \{ \n  QrCode,/, "import { \n  Bike, \n  Store, \n  QrCode,");
}

fs.writeFileSync('src/components/PackingVerificationModule.tsx', code);
console.log('Fixed imports');
