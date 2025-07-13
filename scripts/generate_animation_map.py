import os
import json
import struct

MODELS_DIR = os.path.join('client', 'next-js', 'public', 'models', 'skins')

animation_map = {}
skill_map = {}

KEY_PATTERNS = {
    "idle": "idle1",
    "walk": "run",
    "run": "run",
    "jump": "spell4",
    "casting": "channel_windup",
    "castEnd": "spell1",
    "cast": "cast",
    "dying": "death",
    "hitReaction": "hit_reaction",
    "attack": "attack",
    "attack360": "attack_360",
}

def load_names(path):
    with open(path, 'rb') as f:
        header = f.read(12)
        if header[:4] != b'glTF':
            raise ValueError('not a glb file')
        # first chunk header
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        json_bytes = f.read(chunk_len)
    data = json.loads(json_bytes.decode('utf-8'))
    anims = data.get('animations', [])
    return [a.get('name', '') for a in anims]

def find_match(names, expected, prefix):
    lower_map = {n.lower(): n for n in names}
    if expected.lower() in lower_map:
        return lower_map[expected.lower()]
    core = expected.lower()
    if core.startswith(prefix.lower() + '_'):
        core = core[len(prefix)+1:]
    for n in names:
        if core in n.lower():
            return n
    return expected

for filename in os.listdir(MODELS_DIR):
    if filename.lower().endswith('.glb'):
        path = os.path.join(MODELS_DIR, filename)
        skin = os.path.splitext(filename)[0]
        try:
            names = load_names(path)
        except Exception as e:
            print(f"Failed to load {path}: {e}")
            continue
        animation_map[skin] = names
        mapping = {}
        for key, pattern in KEY_PATTERNS.items():
            if key in ("cast", "hitReaction", "attack", "attack360"):
                expected = pattern
            else:
                expected = f"{skin}_{pattern}.anm"
            mapping[key] = find_match(names, expected, skin)
        skill_map[skin] = mapping

output_dir = os.path.join('client', 'next-js', 'consts')
os.makedirs(output_dir, exist_ok=True)

with open(os.path.join(output_dir, 'skinAnimationMap.json'), 'w') as f:
    json.dump(animation_map, f, indent=2)

with open(os.path.join(output_dir, 'skinSkillMap.json'), 'w') as f:
    json.dump(skill_map, f, indent=2)

print(f"Written animation map for {len(animation_map)} skins to {output_dir}")
