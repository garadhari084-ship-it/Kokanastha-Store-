import re
with open("src/components/PackingVerificationModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"  const \[showSuccessModal, setShowSuccessModal\] = useState<boolean>\(false\);\n", "", content)
content = re.sub(r"  const \[completedOrderNum, setCompletedOrderNum\] = useState<string>\(''\);\n", "", content)
content = re.sub(r"      setCompletedOrderNum\(selectedOrder\.order_number\);\n", "", content)

with open("src/components/PackingVerificationModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
