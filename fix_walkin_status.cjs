const fs = require('fs');
let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf-8');

// Update Edit Flow
content = content.replace(
  "status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Packing' : (existingOrder?.status || 'Pending'),",
  "status: isFulfilledImmediately ? 'Delivered' : existingOrder?.status === 'Packed' ? 'Packing' : (existingOrder?.status || 'Pending'),"
);

content = content.replace(
  "delivery_status: isFulfilledImmediately || isWalkIn ? 'Delivered' : existingOrder?.delivery_status || 'Pending',",
  "delivery_status: isFulfilledImmediately ? 'Delivered' : existingOrder?.delivery_status || 'Pending',"
);

// Update Create Flow
content = content.replace(
  "status: isFulfilledImmediately || isWalkIn ? 'Delivered' : 'Pending',",
  "status: isFulfilledImmediately ? 'Delivered' : 'Pending',"
);

content = content.replace(
  "delivery_status: isFulfilledImmediately || isWalkIn ? 'Delivered' : 'Pending',",
  "delivery_status: isFulfilledImmediately ? 'Delivered' : 'Pending',"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
