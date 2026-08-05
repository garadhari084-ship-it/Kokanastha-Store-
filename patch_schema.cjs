const fs = require('fs');
let file = fs.readFileSync('src/db/schema.sql', 'utf8');

file = file.replace(
  `    discount_amount DECIMAL(15,2) DEFAULT 0.00,`,
  `    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    additional_charges DECIMAL(15,2) DEFAULT 0.00,
    additional_charges_type VARCHAR(50) DEFAULT 'Delivery',`
);

fs.writeFileSync('src/db/schema.sql', file);
