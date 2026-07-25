with open("src/components/PackingVerificationModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = """    const activeId = selectedOrderRef.current?.id;
    if (activeId) {
      const refreshed = allSales.find(o => o.id === activeId);
      if (refreshed) {
        setSelectedOrder({
          ...refreshed,
          items: refreshed.items ? refreshed.items.map(it => ({ ...it })) : []
        });
      }
    }"""

replacement = """    const activeId = selectedOrderRef.current?.id;
    if (activeId) {
      const refreshed = allSales.find(o => o.id === activeId);
      if (refreshed && (refreshed.status === 'Pending' || refreshed.status === 'Packing')) {
        setSelectedOrder({
          ...refreshed,
          items: refreshed.items ? refreshed.items.map(it => ({ ...it })) : []
        });
      } else {
        setSelectedOrder(null);
      }
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/components/PackingVerificationModule.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")
