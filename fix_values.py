with open('src/components/DashboardView.tsx', 'r') as f:
    lines = f.readlines()

in_grid = False
for i, line in enumerate(lines):
    if '{/* 8 GLOWING OPERATIONAL METRIC CARDS GRID */}' in line:
        in_grid = True
    if '          </motion.div>' in line and in_grid:
        in_grid = False

    if in_grid:
        if '                <div>\n' == line or '                <div>\r\n' == line or line.strip() == '<div>':
            if '                  <span className="text-base font-black ' in lines[i+1]:
                lines[i] = line.replace('<div>', '<div className="text-right mt-1">')
        if '                  <span className="text-base font-black ' in line:
            lines[i] = line.replace('text-base', 'text-xl')
        

with open('src/components/DashboardView.tsx', 'w') as f:
    f.writelines(lines)
