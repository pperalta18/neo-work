#!/usr/bin/env python3
"""Pipeline v2 de assets del Pueblo: genera → quita fondo (BiRefNet) → normaliza.

Lee manifest.json (prompts rescatados de los logs de la v1). Etapas por asset:
  raw/<n>.png   generación GPT Image 2 a 1024x1024 quality high (se CONSERVA)
  cut/<n>.png   alfa real vía bgremove.py (se salta si raw ya trae alfa)
  out/<n>.png   normalize2.py → staging; se instala a Resources tras la QA

Uso:
  pipeline.py gen|cut|norm|all <asset.png> [--prompt "..."] [--ref imagen.png]
  pipeline.py all tile-grass.png            # los tile-*/int-* van por --tile
  pipeline.py reprocess <asset.png>         # interiores: raw-interior/ → cut → out
--prompt/--ref puentean el manifest (p. ej. el rediseño del protagonista).
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
GENERATE = Path.home() / ".claude/skills/image-gen/generate.py"
MANIFEST = HERE / "manifest.json"
RAW, CUT, OUT = HERE / "raw", HERE / "cut", HERE / "out"


def run(cmd: list) -> None:
    print("$", " ".join(str(c) for c in cmd), file=sys.stderr)
    subprocess.run([str(c) for c in cmd], check=True)


def is_tile(name: str) -> bool:
    return name.startswith(("tile-", "int-floor", "int-wall"))


def has_real_alpha(path: Path) -> bool:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    corners = [img.getpixel(p)[3] for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    if any(a > 8 for a in corners):
        return False
    hist = img.getchannel("A").histogram()
    return hist[0] / (w * h) > 0.02


def entry(name: str, prompt: str | None, ref: str | None) -> tuple[str, str | None]:
    if prompt:
        return prompt, ref
    data = json.loads(MANIFEST.read_text())
    if name not in data:
        raise SystemExit(f"{name} no está en manifest.json y no se pasó --prompt")
    e = data[name]
    eref = ref or e.get("image_ref")
    if eref:
        p = Path(eref)
        cand = p if p.is_absolute() else HERE / p
        if not cand.exists():
            cand = HERE / p.name  # refs viejos tipo /tmp/town2/style-a.png
        if not cand.exists():
            raise SystemExit(f"{name}: referencia {eref} no existe todavía")
        eref = str(cand)
    return e["prompt"], eref


def gen(name: str, prompt: str | None, ref: str | None) -> None:
    prompt, ref = entry(name, prompt, ref)
    RAW.mkdir(exist_ok=True)
    cmd = [sys.executable, GENERATE, prompt, "--size", "1024x1024", "--quality", "high",
           "--format", "png", "--out", RAW / name, "--timeout", "300"]
    if ref:
        cmd += ["--image", ref]
    run(cmd)


def cut(name: str) -> None:
    CUT.mkdir(exist_ok=True)
    src = RAW / name
    if has_real_alpha(src):
        (CUT / name).write_bytes(src.read_bytes())
        print(f"{name}: alfa real de origen, BiRefNet no necesario")
    else:
        run([sys.executable, HERE / "bgremove.py", src, CUT / name])


def norm(name: str) -> None:
    OUT.mkdir(exist_ok=True)
    if is_tile(name):
        run([sys.executable, HERE / "normalize2.py", "--tile", RAW / name, OUT / name])
    else:
        run([sys.executable, HERE / "normalize2.py", CUT / name, OUT / name])


def main() -> None:
    args = sys.argv[1:]
    prompt = ref = None
    if "--prompt" in args:
        i = args.index("--prompt"); prompt = args[i + 1]; del args[i:i + 2]
    if "--ref" in args:
        i = args.index("--ref"); ref = args[i + 1]; del args[i:i + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    stage, name = args
    if stage == "reprocess":
        src = HERE / "raw-interior" / name
        if is_tile(name):
            OUT.mkdir(exist_ok=True)
            run([sys.executable, HERE / "normalize2.py", "--tile", src, OUT / name])
        else:
            CUT.mkdir(exist_ok=True)
            if has_real_alpha(src):
                (CUT / name).write_bytes(src.read_bytes())
            else:
                run([sys.executable, HERE / "bgremove.py", src, CUT / name])
            OUT.mkdir(exist_ok=True)
            run([sys.executable, HERE / "normalize2.py", CUT / name, OUT / name])
        return
    if stage in ("gen", "all"):
        gen(name, prompt, ref)
    if stage in ("cut", "all") and not is_tile(name):
        cut(name)
    if stage in ("norm", "all"):
        norm(name)


if __name__ == "__main__":
    main()
