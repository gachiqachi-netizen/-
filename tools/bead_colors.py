"""Build a reviewable color patch for beads missing c in a public catalog."""
import argparse
import io
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / 'deploy/data-files/bead-colors-2026-11.json'
PALETTE = [
    ('海蓝宝', '#78b8c6'), ('月光', '#b7b5c4'), ('曜石', '#33343b'),
    ('发晶', '#9f8057'), ('草莓晶', '#bc6681'), ('紫', '#8864a6'),
    ('粉', '#ca829d'), ('蓝', '#658caf'), ('绿', '#719b75'),
    ('黄', '#c9a85c'), ('橙', '#c88c56'), ('红', '#b65e5b'),
    ('白', '#c7c7c2'), ('黑', '#424349'), ('金', '#b69a5c'),
    ('银', '#a7a9ae'), ('茶', '#8e7464'), ('灰', '#84878a'),
    ('蜜蜡', '#c9a15c'), ('玛瑙', '#a17066'), ('水晶', '#aaa0a5'),
]


def shade(hex_color):
    rgb = tuple(bytes.fromhex(hex_color.lstrip('#')))
    light = tuple(round(v * .72 + 255 * .28) for v in rgb)
    dark = tuple(round(v * .67) for v in rgb)
    return ['#%02x%02x%02x' % light, '#%02x%02x%02x' % dark]


def name_color(name, material=''):
    if material == 'metal':
        base = '#b69a5c' if '金' in name else '#a7a9ae'
        return shade(base)
    for word, base in PALETTE:
        if word in name:
            return shade(base)
    return shade('#978b81')


def photo_color(data):
    """Find the most common colored region inside the central bead circle."""
    with Image.open(io.BytesIO(data)) as raw:
        image = raw.convert('RGB')
        image.thumbnail((128, 128))
    width, height = image.size
    buckets = {}
    for y in range(height):
        for x in range(width):
            if ((x + .5 - width / 2) / (width * .44)) ** 2 + ((y + .5 - height / 2) / (height * .44)) ** 2 > 1:
                continue
            r, g, b = image.getpixel((x, y))
            if min(r, g, b) > 235 or max(r, g, b) < 24:
                continue
            key = (r // 24, g // 24, b // 24)
            count, sums = buckets.get(key, (0, (0, 0, 0)))
            buckets[key] = (count + 1, (sums[0] + r, sums[1] + g, sums[2] + b))
    if not buckets:
        return None
    count, sums = max(buckets.values(), key=lambda item: item[0])
    if count < width * height * .015:
        return None
    return shade('#%02x%02x%02x' % tuple(round(v / count) for v in sums))


def default_url():
    config = (ROOT / 'miniprogram/config.js').read_text(encoding='utf-8')
    match = re.search(r"release:\s*\{apiBase:\s*['\"]([^'\"]+)", config)
    if not match:
        raise ValueError('找不到正式环境 apiBase')
    return match.group(1).rstrip('/') + '/api/catalog'


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(url, timeout=15) as response:
                return response.read()
        except OSError:
            if attempt == 2:
                raise
            time.sleep(.2 * (attempt + 1))


def process(bead, base):
    name = bead.get('name') or ''
    photo = bead.get('photoSm') or bead.get('photo')
    colors = None
    data = None
    if photo:
        try:
            data = fetch(urljoin(base, photo))
            if bead.get('mat') != 'metal':
                colors = photo_color(data)
        except (OSError, ValueError):
            pass
    source = 'photo' if colors else 'name'
    return {'id': bead['id'], 'c': colors or name_color(name, bead.get('mat')), 'source': source}, data


def contact_sheet(results, beads, path, count=40):
    fallback = [item['id'] for item, _ in results if item['source'] == 'name']
    chosen = list(dict.fromkeys(fallback + [item['id'] for item, _ in results[:count]]))
    by_id = {item['id']: (item, data) for item, data in results}
    names = {bead['id']: bead.get('name', '') for bead in beads}
    sheet = Image.new('RGB', (680, len(chosen) * 82), 'white')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 15)
    except OSError:
        font = ImageFont.load_default()
    for index, rid in enumerate(chosen):
        item, data = by_id[rid]
        y = index * 82
        if data:
            try:
                with Image.open(io.BytesIO(data)) as raw:
                    thumbnail = raw.convert('RGB')
                    thumbnail.thumbnail((70, 70))
                    sheet.paste(thumbnail, (5, y + 5))
            except OSError:
                pass
        for offset, color in enumerate(item['c']):
            draw.rectangle((84 + 70 * offset, y + 7, 146 + 70 * offset, y + 69), fill=color)
        label = f"{rid} {names[rid]} ({item['source']})"
        draw.text((235, y + 30), label, fill='black', font=font)
    sheet.save(path)
    return len(chosen)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default=default_url())
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--sheet', type=Path, default=ROOT / 'deploy/data-files/bead-colors-2026-11-contact.png')
    args = parser.parse_args(argv)
    catalog = json.loads(fetch(args.url))
    beads = [bead for bead in catalog['beads'] if bead.get('id') and not bead.get('c')]
    base = args.url.rsplit('/', 2)[0] + '/'
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(lambda bead: process(bead, base), beads))
    args.output.write_text(json.dumps([item for item, _ in results], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    shown = contact_sheet(results, beads, args.sheet)
    print(f"写入 {len(results)} 条；照片 {sum(item['source'] == 'photo' for item, _ in results)}，名称 {sum(item['source'] == 'name' for item, _ in results)}；拼图 {shown} 条")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
