import re

with open("src/components/SalesModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = """        qr_code_data: `${orderNum}|${selectedCustomerId}|${customerObj?.name || 'Customer'}|${orderItems.length} items`,"""
replacement = """        qr_code_data: `${orderNum}|${finalCustomerId}|${finalCustomerName}|${orderItems.length} items`,"""
content = content.replace(target, replacement)

target_update = """      // Update customer outstanding debt
      if (customerObj) {
        dbStore.updateCustomer(selectedCustomerId, {"""
replacement_update = """      // Update customer outstanding debt
      if (customerObj) {
        dbStore.updateCustomer(finalCustomerId, {"""
content = content.replace(target_update, replacement_update)

with open("src/components/SalesModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
