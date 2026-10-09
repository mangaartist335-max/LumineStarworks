import os, re

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"

replacements = [
    ("Flame Guns", "Flame Guns"),
    ("Flame guns", "Flame guns"),
    ("flame guns", "flame guns"),
    ("FLAME GUNS", "FLAME GUNS"),
    ("Flame Guns", "Flame Guns"),
    ("flame guns", "flame guns"),
    ("FLAME GUNS", "FLAME GUNS"),
    ("Flame Guns", "Flame Guns"),
    ("flame guns", "flame guns"),
]

modified_count = 0

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith(".html") or f.endswith(".py") or f.endswith(".js") or f.endswith(".css"):
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
