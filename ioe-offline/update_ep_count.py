import os

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"

replacements = [
    ("25 (planned)", "25 (planned)"),
    ("25 planned", "25 planned"),
    ("25 Available", "25 Available"),
    ("25 episodes", "25 episodes"),
    ("25-episode", "25-episode"),
    ("25 ep", "25 ep"),
    ("1 (of 25 planned)", "1 (of 25 planned)"),
]

modified_count = 0

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith(".html") or f.endswith(".py"):
            filepath = os.path.join(root, f)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
            
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as file:
                    file.write(new_content)
                modified_count += 1
                print(f"Updated: {f}")

print(f"Total files updated: {modified_count}")
