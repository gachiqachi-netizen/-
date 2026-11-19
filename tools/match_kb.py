"""Match public catalog bead names to reviewed material entries; leave uncertain names for review."""
import argparse
import json
import re
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
CATALOG = 'https://api.beadloop.cn/api/catalog'
OUTPUT = ROOT / 'deploy/data-files/bead-kb-links-2026-11.json'
# Only material-specific trade names, not shape/color alone.
MATERIALS = {
    '乌拉圭紫': 'zi-jing', '巴西紫': 'zi-jing', '玻利维亚紫': 'zi-jing',
    '巴西黄': 'huang-shuijing', '柠檬黄': 'huang-shuijing',
    '婚纱白幽灵': 'youling', '四季幽灵': 'youling', '羽毛幽灵': 'youling',
    '粉雪花幽灵': 'youling', '红幽灵': 'youling', '绿幽灵': 'youling',
    '白阿塞': 'bai-shuijing',
    '碎冰冰海蓝宝': 'hailanbao', '岛屿海蓝宝': 'hailanbao',
    '奶茶月光': 'yueguang-shi', '橙月光': 'yueguang-shi', '灰月光': 'yueguang-shi',
    '白月光': 'yueguang-shi', '蓝月光': 'yueguang-shi',
    '粉草莓晶': 'caomei-jing', '绿草莓晶': 'caomei-jing', '鸽血红草莓晶': 'caomei-jing',
    '紫牙乌榴石': 'shiliu', '紫马粉': 'shiliu', '马粉': 'shiliu',
    '红兔毛': 'fa-jing', '绿兔毛': 'fa-jing', '绒蓝兔毛': 'fa-jing',
    '维纳斯发晶': 'fa-jing', '绿发晶': 'fa-jing', '黑发晶': 'fa-jing',
    '金太阳': 'riguang-shi',
    '蓝磷灰': 'linhui', '沙弗莱': 'shiliu',
    
    '沉香': 'chenxiang', '贝珠': 'beike',
    '银曜石': 'heiyao', '金曜石': 'heiyao',
    '红碧玉': 'bi-shi',
}
MATERIALS.update({'吉金石青金石': 'qingjin', '孔雀石孔产白': 'kongque', '干此巴西紫': 'zi-jing', '白水晶屁桃': 'bai-shuijing', '粉水晶屁桃': 'fen-jing', '粉草莓五瓣花': 'caomei-jing', '绿松石屁桃': 'lvsong', '艹卡呵蓝虎眼': 'huyan-shi', '黄玛瑙': 'putong-manao', '印度玛瑙': 'putong-manao', '灰玛瑙': 'putong-manao', '蓝纹玛瑙': 'putong-manao', '银曜石小熊': 'heiyao', '银曜石猫头': 'heiyao', '925银哑光银珠': 'zhuanyun', '999银小狗': 'zhuanyun', '999银法棍狗': 'zhuanyun', '999银猫头': 'zhuanyun', '克罗十字圆珠': 'zhuanyun', '克罗十字方块': 'zhuanyun', '哑光金珠': 'zhuanyun', '清迈手工925银扭纹款': 'zhuanyun', '清迈手工925银方块款': 'zhuanyun', '清迈手工925银雕花圆轮': 'zhuanyun', '藏银五面花方块': 'zhuanyun', '藏银克罗十字': 'zhuanyun', '藏银十字架-凸': 'zhuanyun', '藏银十字架-凹': 'zhuanyun', '藏银喜鹊': 'zhuanyun', '藏银小南瓜': 'zhuanyun', '藏银小花方块': 'zhuanyun', '藏银树叶纹': 'zhuanyun', '藏银桃花': 'zhuanyun', '藏银棱块': 'zhuanyun', '藏银祥云镂空': 'zhuanyun', '藏银竹叶圆珠': 'zhuanyun', '藏银银块': 'zhuanyun', '锆石银燕子': 'zhuanyun', '藏银飞碟': 'zhuanyun'})

# Names that can mean several materials or describe a component rather than a single bead.
REVIEW = {'乌拉圭紫与拉主紫', '士相红主青提奶盖', '婚纱白方糖', '樱花粉', '樱花雨',
          '深海蓝晶·甄选', '羽化蓝晶', '青提玉葡', '黑金超·红黄', '黑金超·红黑',
          '花绿石', '蓝点玉', '蓝松石', '蓝松石屁桃', '黄玉', '吉金石青金石',
          '紫水小马',
          '镀金白水元宝',
          '黄水元宝', '白猫眼', '黄猫眼', '白猫眼跑环17mm', '黄猫眼跑环17mm', '18K镀金+翡翠龙柱'}


def normalize(name):
    name = re.sub(r'·(?:甄选|精选|高闪)$', '', name.strip())
    name = re.sub(r'\d+(?:\.\d+)?\s*mm', '', name, flags=re.I)
    name = re.sub(r'(?:跑环|方糖|随形|随行|五瓣花|蝴蝶|南瓜珠|圆珠|桶珠|方块|双尖|无事牌|药片)$', '', name)
    return name.strip('·- +')


def load_entries(root=ROOT):
    return [item for path in sorted((root / 'kb/data/beads').glob('*.json'))
            for item in json.loads(path.read_text(encoding='utf-8'))]


def match(name, entries):
    if name in MATERIALS:
        return MATERIALS[name]
    if name in REVIEW:
        return None
    clean = normalize(name)
    if clean in MATERIALS:
        return MATERIALS[clean]
    aliases = {}
    for item in entries:
        for alias in [item['name'], *item.get('aliases', [])]:
            aliases.setdefault(alias, set()).add(item['id'])
    if clean in aliases and len(aliases[clean]) == 1:
        return next(iter(aliases[clean]))
    # A material named in a shape or color variant can be used only if one longest alias wins.
    hits = [(len(alias), next(iter(ids))) for alias, ids in aliases.items()
            if len(alias) >= 2 and alias in clean and len(ids) == 1]
    if hits:
        best = max(length for length, _ in hits)
        winners = {id for length, id in hits if length == best}
        if len(winners) == 1:
            return next(iter(winners))
    return None


def run(catalog, root=ROOT):
    entries = load_entries(root)
    known = {item['id'] for item in entries}
    links, pending = [], []
    for bead in catalog['beads']:
        if not bead.get('id', '').startswith('sm20261116-') or bead.get('kb'):
            continue
        target = match(bead.get('name', ''), entries)
        if target in known:
            links.append({'id': bead['id'], 'kb': target})
        else:
            pending.append({'id': bead['id'], 'name': bead.get('name', '')})
    return links, pending


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default=CATALOG)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    with urlopen(args.url, timeout=30) as response:
        catalog = json.load(response)
    links, pending = run(catalog)
    args.output.write_text(json.dumps(links, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'已匹配 {len(links)}；待确认 {len(pending)}')
    for item in pending:
        print(f"{item['id']}\t{item['name']}")


if __name__ == '__main__':
    main()
