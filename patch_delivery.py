with open("src/components/DeliveryModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = """  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
    });
  }, [businessId]);"""

replacement = """  useEffect(() => {
    return dbStore.subscribe(() => {
      setCustomers(dbStore.getCustomers(businessId));
      reloadOrders();
    });
  }, [businessId]);"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/components/DeliveryModule.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
