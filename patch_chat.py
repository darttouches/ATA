path = "D:/Touches D'Art/siteATA/frontend/src/app/games/loup-garou/LoupGarouGame.jsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
# Keep only first 1085 lines (0-indexed: 0..1084 = lines 1..1085)
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines[:1085])
print('Done. Total lines written:', 1085)
