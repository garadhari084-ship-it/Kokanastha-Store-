import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the start of handleLoginSubmit
target_start = """  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');"""

replacement_start = """  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {"""

content = content.replace(target_start, replacement_start)

# Replace the end of handleLoginSubmit
target_end = """    }
  };

  const handleLogout = () => {"""

replacement_end = """    }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {"""

content = content.replace(target_end, replacement_end)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
