#!/usr/bin/env python3
"""Quita el fondo de un PNG con BiRefNet v2 en fal.ai y guarda PNG con alfa real.

Sustituye al flood-fill de normalize.py, que se comía bordes y dejaba flecos.

Uso: bgremove.py entrada.png salida.png
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MODEL = "fal-ai/birefnet/v2"


def fal_key() -> str:
    key = os.environ.get("FAL_KEY")
    if not key:
        env = Path.home() / ".claude/fal.env"
        if env.exists():
            for line in env.read_text().splitlines():
                if line.startswith("FAL_KEY="):
                    key = line.split("=", 1)[1].strip()
    if not key:
        raise SystemExit("FAL_KEY no encontrado (env o ~/.claude/fal.env)")
    return key


def api(url: str, payload=None, key: str = "") -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"fal {e.code} en {url}: {e.read().decode()[:500]}")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    key = fal_key()
    data_uri = "data:image/png;base64," + base64.b64encode(src.read_bytes()).decode()
    sub = api(
        f"https://queue.fal.run/{MODEL}",
        {
            "image_url": data_uri,
            "model": "General Use (Heavy)",
            "operating_resolution": "2048x2048",
            "output_format": "png",
            "refine_foreground": True,
        },
        key,
    )
    status_url = sub["status_url"]
    response_url = sub["response_url"]
    for _ in range(120):
        if api(status_url, key=key)["status"] == "COMPLETED":
            break
        time.sleep(2)
    else:
        raise SystemExit(f"{src.name}: timeout esperando a {MODEL}")
    result = api(response_url, key=key)
    img_url = result["image"]["url"]
    dst.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(img_url, timeout=180) as resp:
        dst.write_bytes(resp.read())
    print(f"{src.name} -> {dst} (alfa BiRefNet)")


if __name__ == "__main__":
    main()
