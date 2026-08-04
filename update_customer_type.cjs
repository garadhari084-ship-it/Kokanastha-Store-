const fs = require('fs');
let content = fs.readFileSync('src/types/erp.ts', 'utf8');

const oldInterface = `export interface Customer {
  id: string;
  name: string;`;
const newInterface = `export interface Customer {
  id: string;
  name: string;
  image_url?: string;`;

content = content.replace(oldInterface, newInterface);
fs.writeFileSync('src/types/erp.ts', content);
