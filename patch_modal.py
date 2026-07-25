import re
with open("src/components/PackingVerificationModule.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = r"      \{showSuccessModal && \([\s\S]*?\)\}    </div>"
replacement = """    </div>"""

content = re.sub(target, replacement, content)

with open("src/components/PackingVerificationModule.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
