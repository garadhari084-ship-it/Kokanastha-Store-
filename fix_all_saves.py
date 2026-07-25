import re

with open("src/services/store.ts", "r", encoding="utf-8") as f:
    content = f.read()

def replace_save(match):
    prefix = match.group(1)
    cache_arr = match.group(2)
    table_name = match.group(3)
    return f"{prefix}this.save('{table_name}', this.cache.{cache_arr}[index]);"

content = re.sub(r"(this\.cache\.([a-zA-Z0-9_]+)\[index\] = \{ \.\.\.this\.cache\.\2\[index\], \.\.\.updates \};\n\s*)this\.save\('([a-zA-Z0-9_]+)'\);", replace_save, content)

# For stockLogs, auditLogs
content = re.sub(r"this\.cache\.stockLogs\.push\(newLog\);\n\s*this\.save\('stockLogs'\);", r"this.cache.stockLogs.push(newLog);\n    this.save('stockLogs', newLog);", content)
content = re.sub(r"this\.cache\.auditLogs\.unshift\(newLog\);\n\s*this\.save\('auditLogs'\);", r"this.cache.auditLogs.unshift(newLog);\n    this.save('auditLogs', newLog);", content)

# For settings
content = re.sub(r"this\.cache\.settings\[index\] = \{\.\.\.this\.cache\.settings\[index\], \.\.\.updates\};\n\s*this\.save\('settings'\);", r"this.cache.settings[index] = {...this.cache.settings[index], ...updates};\n      this.save('settings', this.cache.settings[index]);", content)


with open("src/services/store.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
