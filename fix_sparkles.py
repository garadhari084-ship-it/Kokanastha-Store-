with open("src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == "Sparkles":
        lines[i] = "  Sparkles,\n"
        break

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("SUCCESS")
