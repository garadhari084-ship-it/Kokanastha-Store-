import re
with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("this.cache.products[productIndex].current_stock += changeQty;\n      this.save('products');", "this.cache.products[productIndex].current_stock += changeQty;\n      this.save('products', this.cache.products[productIndex]);")
content = content.replace("this.cache.auditLogs.unshift(newLog); // newer logs first\n    this.save('auditLogs');", "this.cache.auditLogs.unshift(newLog); // newer logs first\n    this.save('auditLogs', newLog);")
content = content.replace("this.cache.settings.push(merged);\n      this.save('settings');", "this.cache.settings.push(merged);\n      this.save('settings', merged);")

with open("src/services/store.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
