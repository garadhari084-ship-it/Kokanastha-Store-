import re

with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix updateCategory
content = re.sub(r"this\.cache\.categories\[index\] = newCat;\n\s*this\.save\('categories'\);", 
                 r"this.cache.categories[index] = newCat;\n      this.save('categories', newCat);", content)

# Fix updateProduct
content = re.sub(r"this\.cache\.products\[index\] = newProd;\n\s*this\.save\('products'\);", 
                 r"this.cache.products[index] = newProd;\n      this.save('products', newProd);", content)

# Fix updateCustomer
content = re.sub(r"this\.cache\.customers\[index\] = newCust;\n\s*this\.save\('customers'\);", 
                 r"this.cache.customers[index] = newCust;\n      this.save('customers', newCust);", content)

# Fix updateSupplier
content = re.sub(r"this\.cache\.suppliers\[index\] = newSupp;\n\s*this\.save\('suppliers'\);", 
                 r"this.cache.suppliers[index] = newSupp;\n      this.save('suppliers', newSupp);", content)

# Fix updatePurchaseOrder
content = re.sub(r"this\.cache\.purchases\[index\] = newPO;\n\s*this\.save\('purchases'\);", 
                 r"this.cache.purchases[index] = newPO;\n      this.save('purchases', newPO);", content)

# Fix updateSalesOrder
content = re.sub(r"this\.cache\.sales\[index\] = newSO;\n\s*this\.save\('sales'\);", 
                 r"this.cache.sales[index] = newSO;\n      this.save('sales', newSO);", content)

with open("src/services/store.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
