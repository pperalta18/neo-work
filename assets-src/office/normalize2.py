#!/usr/bin/env python3
"""Normaliza v2: asume alfa real (salida de bgremove.py) y reescala con LANCZOS.

Sustituye a normalize.py (flood-fill + NEAREST). Mismo contrato de salida que
usa la app: sprites 248 px de lado máximo centrados y a ras del borde inferior
en lienzo 256x256; tiles 192x192 a sangre completa y opacos.

Uso:
  normalize2.py entrada.png salida.png            # sprite
  normalize2.py --tile entrada.png salida.png     # tile de suelo/pared
"""
import sys
from pathlib import Path

from PIL import Image

MAX_SIDE = 248
CANVAS = 256
TILE = 192
ALPHA_FLOOR = 12  # mata flecos casi invisibles sin roer el borde real


def clean_alpha(img: Image.Image) -> Image.Image:
    alpha = img.getchannel("A").point(lambda v: 0 if v < ALPHA_FLOOR else v)
    img.putalpha(alpha)
    return img


def sprite(src: Path, dst: Path) -> None:
    img = clean_alpha(Image.open(src).convert("RGBA"))
    bbox = img.getbbox()
    if not bbox:
        raise SystemExit(f"{src}: vacío tras limpiar el alfa")
    img = img.crop(bbox)
    scale = MAX_SIDE / max(img.size)
    img = img.resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
        Image.LANCZOS,
    )
    img = clean_alpha(img)  # el reescalado reparte alfa residual por el borde
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(img, ((CANVAS - img.width) // 2, CANVAS - img.height), img)
    canvas.save(dst)
    print(f"{src.name} -> {dst} ({img.width}x{img.height} sobre {CANVAS}x{CANVAS})")


def tile(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGBA")
    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((TILE, TILE), Image.LANCZOS)
    img = Image.merge("RGBA", (*img.convert("RGB").split(), Image.new("L", img.size, 255)))
    img.save(dst)
    print(f"{src.name} -> {dst} ({TILE}x{TILE} tile)")


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--tile"]
    if len(args) != 2:
        raise SystemExit(__doc__)
    src, dst = Path(args[0]), Path(args[1])
    dst.parent.mkdir(parents=True, exist_ok=True)
    (tile if "--tile" in sys.argv else sprite)(src, dst)


if __name__ == "__main__":
    main()
