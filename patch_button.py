import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Loader2 to imports if not there
if "Loader2" not in content[:1000]:
    content = content.replace("} from 'lucide-react';", "  Loader2,\n} from 'lucide-react';")

# Update button
target = """                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 mt-4 flex justify-center items-center gap-2"
                >
                  Sign In to Operations
                </button>"""

replacement = """                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In to Operations'
                  )}
                </button>"""

content = content.replace(target, replacement)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
