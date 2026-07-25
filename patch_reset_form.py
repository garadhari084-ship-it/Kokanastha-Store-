import re

with open("src/components/SalesModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');", "const [selectedCustomerId, setSelectedCustomerId] = useState('');")
content = content.replace("setSelectedCustomerId(customers[0]?.id || '');", "setSelectedCustomerId('');")

with open("src/components/SalesModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
