"""Generate Profcaria platform icons from the canonical two-colour brand geometry."""

from pathlib import Path
from math import pi, sin

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
GREEN = (20, 61, 51, 255)
IVORY = (244, 240, 230, 255)


def make_icon(size: int) -> Image.Image:
    scale = 4
    canvas_size = size * scale
    margin = round(canvas_size * 0.046875)
    stroke = max(scale, round(canvas_size * 0.03125))
    bounds = (margin, margin, canvas_size - margin, canvas_size - margin)

    circle_mask = Image.new("L", (canvas_size, canvas_size), 0)
    ImageDraw.Draw(circle_mask).ellipse(bounds, fill=255)

    icon = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    ivory_layer = Image.new("RGBA", icon.size, IVORY)
    icon.alpha_composite(Image.composite(ivory_layer, Image.new("RGBA", icon.size), circle_mask))

    top_mask = Image.new("L", icon.size, 0)
    top_draw = ImageDraw.Draw(top_mask)
    radius = (bounds[2] - bounds[0]) / 2
    center_y = canvas_size / 2
    points = [(bounds[0], bounds[1]), (bounds[2], bounds[1])]
    for x in range(bounds[2], bounds[0] - 1, -1):
        phase = (x - bounds[0]) / (2 * radius) * 4 * pi
        points.append((x, round(center_y + sin(phase) * canvas_size * 0.022)))
    top_draw.polygon(points, fill=255)
    top_mask = Image.composite(top_mask, Image.new("L", icon.size, 0), circle_mask)
    icon.alpha_composite(Image.composite(Image.new("RGBA", icon.size, GREEN), Image.new("RGBA", icon.size), top_mask))

    ImageDraw.Draw(icon).ellipse(bounds, outline=GREEN, width=stroke)
    return icon.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    public_icon = make_icon(512)
    public_icon.save(ROOT / "public" / "icon.png", optimize=True)
    public_icon.save(ROOT / "public" / "profcaria.png", optimize=True)
    public_icon.save(ROOT / "app" / "icon.png", optimize=True)

    apple_icon = make_icon(180)
    apple_icon.save(ROOT / "public" / "apple-touch-icon.png", optimize=True)
    apple_icon.save(ROOT / "app" / "apple-touch-icon.png", optimize=True)

    favicon = make_icon(256)
    for destination in (
        ROOT / "public" / "favicon.ico",
        ROOT / "app" / "favicon.ico",
        ROOT / "app" / "icon.ico",
    ):
        favicon.save(destination, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])


if __name__ == "__main__":
    main()
