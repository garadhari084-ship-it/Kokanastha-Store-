import re

with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add pendingUploads
content = content.replace("private listeners: (() => void)[] = [];", "private listeners: (() => void)[] = [];\n  private pendingUploads = new Set<string>();")

# Update syncToSupabase start to add to pendingUploads
target_syncToSupabase = """    if (isDelete && deleteId) {"""
replacement_syncToSupabase = """    if (dataItem) {
        if (Array.isArray(dataItem)) {
            dataItem.forEach((item: any) => { if (item && item.id) this.pendingUploads.add(item.id) });
        } else if (dataItem.id) {
            this.pendingUploads.add(dataItem.id);
        }
    }
    
    if (isDelete && deleteId) {"""
content = content.replace(target_syncToSupabase, replacement_syncToSupabase)

# Update syncToSupabase end to remove from pendingUploads
target_end = """       if (tableName === 'purchase_orders' && purchaseItems.length > 0) {
           const { error: err3 } = await supabase.from('purchase_order_items').upsert(purchaseItems);
           if (err3) console.error('Supabase sync error on purchase_order_items:', JSON.stringify(err3));
       }
    }
    } catch (err: any) {"""

replacement_end = """       if (tableName === 'purchase_orders' && purchaseItems.length > 0) {
           const { error: err3 } = await supabase.from('purchase_order_items').upsert(purchaseItems);
           if (err3) console.error('Supabase sync error on purchase_order_items:', JSON.stringify(err3));
       }
       
       if (dataItem) {
           if (Array.isArray(dataItem)) {
               dataItem.forEach((item: any) => { if (item && item.id) this.pendingUploads.delete(item.id) });
           } else if (dataItem.id) {
               this.pendingUploads.delete(dataItem.id);
           }
       }
    }
    } catch (err: any) {"""
content = content.replace(target_end, replacement_end)

# Update syncFromSupabase sales mapping
target_sales = """             const mergedSales = (data || []).map((so: any) => {
               const existingSO = (this.cache.sales || []).find(s => s.id === so.id);"""
replacement_sales = """             const mergedSales = (data || []).map((so: any) => {
               const existingSO = (this.cache.sales || []).find(s => s.id === so.id);
               if (existingSO && this.pendingUploads.has(existingSO.id)) return existingSO;"""
content = content.replace(target_sales, replacement_sales)

# Update syncFromSupabase purchases mapping
target_purchases = """             const mergedPurchases = (data || []).map((po: any) => {
               const existingPO = (this.cache.purchases || []).find(p => p.id === po.id);"""
replacement_purchases = """             const mergedPurchases = (data || []).map((po: any) => {
               const existingPO = (this.cache.purchases || []).find(p => p.id === po.id);
               if (existingPO && this.pendingUploads.has(existingPO.id)) return existingPO;"""
content = content.replace(target_purchases, replacement_purchases)

with open("src/services/store.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
