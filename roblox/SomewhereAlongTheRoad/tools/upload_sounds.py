"""Uploads the sound pack to Roblox and plugs every id straight into the game.

It uses Roblox's Open Cloud Assets API, so the sounds end up on your own account, then writes
each new id into Config.Sounds (in Config.luau). After that, rebuild (lune run tools/build.luau)
and the place file has every sound already in.

You'll need an Open Cloud API key:
  create.roblox.com > Open Cloud > API Keys > Create API Key
  add the "Assets" API with Read and Write, and allow your IP (or 0.0.0.0/0).
And your Roblox user id (the number in your profile's web address).

Usage (from the project folder):
  python3 tools/upload_sounds.py --user-id 123456 --key YOUR_KEY
  (or set ROBLOX_API_KEY instead of passing --key)
Options:
  --only Wind Rain   upload just these
  --dry-run          show what would be uploaded, upload nothing

Slots that already have an id in Config.Sounds are skipped, so it's safe to run again (handy if
Roblox's monthly audio limit stops it partway: run it again next month for the rest).
It also writes dist/SoundIds_CommandBar.lua: paste that into Studio's Command Bar to fill the
SoundService.SomewhereSounds slots in a place you already have open.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO = os.path.join(ROOT, "audio")
CONFIG = os.path.join(ROOT, "src", "ReplicatedStorage", "SomewhereShared", "Config.luau")
SNIPPET = os.path.join(ROOT, "dist", "SoundIds_CommandBar.lua")
BASE = os.environ.get("SOMEWHERE_OPEN_CLOUD_URL", "https://apis.roblox.com")

# The ten that cover the whole trailer go first, in case the monthly limit is tight.
ORDER = [
    "DayBirds", "Wind", "NightCrickets", "Rain", "Thunder", "Creek", "StoreHum", "DinerChatter",
    "Horn", "SoftHum", "Engine", "StoreChime", "Chicken", "Rustle", "CounterBell", "Door",
    "Jukebox", "IceCreamTune", "Owl", "Tractor", "Mower", "Sip",
]

SLOT_LINE = re.compile(r'^(\t)(\w+)( = ")([^"]*)(",)', re.M)


def config_slots(text):
    """{slot: id} from the Config.Sounds table."""
    block = text[text.index("Config.Sounds = {"):]
    block = block[: block.index("\n}") + 2]
    return {m.group(2): m.group(4) for m in SLOT_LINE.finditer(block)}


def set_config_id(path, slot, asset_id):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    start = text.index("Config.Sounds = {")
    end = text.index("\n}", start) + 2
    block = text[start:end]
    new_block, n = re.subn(
        rf'^(\t{slot} = ")[^"]*(",)', rf"\g<1>rbxassetid://{asset_id}\g<2>", block, count=1, flags=re.M
    )
    if n != 1:
        raise RuntimeError(f"couldn't find the {slot} slot in Config.Sounds")
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text[:start] + new_block + text[end:])


def request(method, url, key, body=None, content_type=None):
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("x-api-key", key)
    if content_type:
        req.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(text)
        except ValueError:
            return e.code, {"message": text}


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, (filename, content_type, data) in files.items():
        head = (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode()
        parts.append(head + data + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def explain(status, body):
    msg = body.get("message") or body.get("errors") or body
    if status in (401, 403):
        return f"Roblox said no ({status}): {msg}. Check the key has the Assets API with Read and Write, and that your IP is allowed."
    if status == 429:
        return f"Roblox says that's enough for now ({status}): {msg}. This is usually the monthly audio upload limit. Run this again later for the rest."
    return f"Roblox returned {status}: {msg}"


def upload(slot, key, user_id):
    path = os.path.join(AUDIO, f"{slot}.ogg")
    with open(path, "rb") as f:
        data = f.read()
    meta = {
        "assetType": "Audio",
        "displayName": f"Somewhere {slot}",
        "description": "Original sound made for Somewhere Along the Road.",
        "creationContext": {"creator": {"userId": str(user_id)}},
    }
    body, ctype = multipart({"request": json.dumps(meta)}, {"fileContent": (f"{slot}.ogg", "audio/ogg", data)})
    status, res = request("POST", f"{BASE}/assets/v1/assets", key, body, ctype)
    if status >= 300:
        raise RuntimeError(explain(status, res))
    op = res.get("operationId") or (res.get("path") or "").split("/")[-1]
    if not op:
        raise RuntimeError(f"Roblox didn't send back an operation for {slot}: {res}")
    # Roblox checks each upload before it gets an id. Usually a few seconds.
    deadline = time.time() + 300
    while time.time() < deadline:
        status, res = request("GET", f"{BASE}/assets/v1/operations/{op}", key)
        if status >= 300:
            raise RuntimeError(explain(status, res))
        if res.get("done"):
            if res.get("error"):
                raise RuntimeError(f"{slot} wasn't accepted: {res['error']}")
            asset = res.get("response") or {}
            asset_id = asset.get("assetId") or (asset.get("path") or "").split("/")[-1]
            if not asset_id:
                raise RuntimeError(f"no asset id in Roblox's answer for {slot}: {res}")
            return asset_id
        time.sleep(2)
    raise RuntimeError(f"{slot} is still being checked after 5 minutes. Run this again later to pick it up.")


def write_snippet(ids):
    lines = ['local f = game:GetService("SoundService"):FindFirstChild("SomewhereSounds")',
             'if not f then warn("No SoundService.SomewhereSounds here. Run the installer first.") return end']
    for slot in ORDER:
        if ids.get(slot):
            lines.append(f'if f:FindFirstChild("{slot}") then f.{slot}.SoundId = "{ids[slot]}" end')
    lines.append('print("Somewhere sounds are in.")')
    os.makedirs(os.path.dirname(SNIPPET), exist_ok=True)
    with open(SNIPPET, "w", encoding="utf-8") as f:
        f.write(" ".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--user-id", required=True)
    ap.add_argument("--key", default=os.environ.get("ROBLOX_API_KEY"))
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--config", default=CONFIG, help=argparse.SUPPRESS)
    args = ap.parse_args()
    if not args.key and not args.dry_run:
        sys.exit("Needs an API key: --key YOUR_KEY or set ROBLOX_API_KEY.")

    with open(args.config, encoding="utf-8") as f:
        ids = config_slots(f.read())
    todo = [s for s in ORDER if (not args.only or s in args.only) and not ids.get(s)]
    missing = [s for s in todo if not os.path.isfile(os.path.join(AUDIO, f"{s}.ogg"))]
    if missing:
        sys.exit(f"Missing audio files: {', '.join(missing)}. Run python3 tools/make_sounds.py first.")
    if not todo:
        print("Every sound already has an id. Nothing to upload.")
    for i, slot in enumerate(todo, 1):
        if args.dry_run:
            print(f"[{i}/{len(todo)}] would upload {slot}")
            continue
        print(f"[{i}/{len(todo)}] uploading {slot}…", end=" ", flush=True)
        try:
            asset_id = upload(slot, args.key, args.user_id)
        except RuntimeError as e:
            print("stopped")
            print(e)
            break
        set_config_id(args.config, slot, asset_id)
        ids[slot] = f"rbxassetid://{asset_id}"
        print(f"done (rbxassetid://{asset_id})")
    filled = [s for s in ORDER if ids.get(s)]
    if filled and not args.dry_run:
        write_snippet(ids)
        print(f"\n{len(filled)} of {len(ORDER)} sounds have ids in Config.Sounds.")
        print("Next: lune run tools/build.luau (the place file then has them built in),")
        print(f"or paste {os.path.relpath(SNIPPET, ROOT)} into Studio's Command Bar.")


if __name__ == "__main__":
    main()
