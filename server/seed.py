"""第一次启动时写进数据库的示例数据：珠子、模板（热门款）、宣传位。之后都在网页后台里改。"""

BEADS = [
    {"id": "zt8", "name": "小叶紫檀", "mm": 8, "price": 3, "mat": "wood", "c": ["#a3442f", "#3d110b"], "tags": ["沉稳", "长寿"]},
    {"id": "zt10", "name": "小叶紫檀", "mm": 10, "price": 4, "mat": "wood", "c": ["#a3442f", "#3d110b"], "tags": ["沉稳", "长寿"]},
    {"id": "jg10", "name": "金刚菩提", "mm": 10, "price": 3, "mat": "wood", "c": ["#bf7442", "#5e2a12"], "tags": ["智慧", "坚毅", "事业"]},
    {"id": "xy8", "name": "星月菩提", "mm": 8, "price": 1, "mat": "bodhi", "c": ["#f6eed8", "#b8935a"], "tags": ["静心", "禅意"]},
    {"id": "nh8", "name": "南红", "mm": 8, "price": 12, "mat": "stone", "c": ["#ec5a3f", "#8e1a10"], "tags": ["红火", "本命年"]},
    {"id": "ft12", "name": "南红佛头", "mm": 12, "price": 18, "mat": "stone", "c": ["#ec5a3f", "#7a140b"], "tags": ["圆满", "吉祥"]},
    {"id": "ml10", "name": "蜜蜡", "mm": 10, "price": 18, "mat": "stone", "c": ["#ffd35c", "#d4870b"], "tags": ["富贵", "温润"]},
    {"id": "qj8", "name": "青金石", "mm": 8, "price": 5, "mat": "stone", "c": ["#3f63d6", "#14236b"], "tags": ["事业", "沉稳"]},
    {"id": "ls8", "name": "绿松石", "mm": 8, "price": 6, "mat": "stone", "c": ["#5fd0c4", "#1e7f78"], "tags": ["平安", "成功", "出行"]},
    {"id": "ls6", "name": "绿松石", "mm": 6, "price": 4, "mat": "stone", "c": ["#5fd0c4", "#1e7f78"], "tags": ["平安", "成功", "出行"]},
    {"id": "hy8", "name": "黑曜石", "mm": 8, "price": 3, "mat": "stone", "c": ["#55556a", "#0b0b10"], "tags": ["沉稳", "坚定"]},
    {"id": "bj8", "name": "白水晶", "mm": 8, "price": 2, "mat": "crystal", "c": ["#ffffff", "#bfcadb"], "tags": ["专注", "清透"]},
    {"id": "fj8", "name": "粉晶", "mm": 8, "price": 3, "mat": "crystal", "c": ["#ffe0e7", "#e08aa0"], "tags": ["好人缘", "温柔"]},
    {"id": "zj8", "name": "紫水晶", "mm": 8, "price": 4, "mat": "crystal", "c": ["#e2c7ff", "#6b3fa0"], "tags": ["智慧", "考试", "学业"]},
    {"id": "cm8", "name": "草莓晶", "mm": 8, "price": 6, "mat": "crystal", "c": ["#ffc7c7", "#c2414f"], "tags": ["甜蜜", "恋爱"]},
    {"id": "zy6", "name": "金色转运珠", "mm": 6, "price": 10, "mat": "metal", "c": ["#fff1b8", "#a87a1c"], "tags": ["好运", "吉祥"]},
    {"id": "sp4", "name": "银色隔珠", "mm": 4, "price": 1, "mat": "metal", "c": ["#ffffff", "#8a8f98"], "tags": ["点缀"]},
    {"id": "sp4z", "name": "铜色隔珠", "mm": 4, "price": 1, "mat": "metal", "c": ["#f0c79a", "#8a5424"], "tags": ["点缀"]},
    {"id": "gp", "name": "金色隔片", "mm": 2, "price": 1, "mat": "metal", "c": ["#fff1b8", "#a87a1c"], "tags": ["点缀"], "spacer": True},
]
# 对应知识库里的品种（kb/data/beads）和卖点属性
KB_MAP = {"zt8": ["xiaoye-zitan", {"origin": "印度"}], "zt10": ["xiaoye-zitan", {"origin": "印度"}], "jg10": ["jingang", {}], "xy8": ["xingyue", {"color": "顺白"}], "nh8": ["nanhong", {"origin": "保山", "color": "柿子红"}], "ft12": ["nanhong", {"origin": "保山", "shape": "佛头"}], "ml10": ["mila", {}], "qj8": ["qingjin", {}], "ls8": ["lvsong", {}], "ls6": ["lvsong", {}], "hy8": ["heiyao", {"color": "乌金"}], "bj8": ["bai-shuijing", {"purity": "净体"}], "fj8": ["fen-jing", {"origin": "马达加斯加"}], "zj8": ["zi-jing", {}], "cm8": ["caomei-jing", {}], "zy6": ["zhuanyun", {"color": "金色"}], "sp4": ["gezhu", {"color": "银色"}], "sp4z": ["gezhu", {}], "gp": ["gezhu", {"color": "金色"}]}
for i, b in enumerate(BEADS):
    b.setdefault("kb", KB_MAP[b["id"]][0])
    b.setdefault("attrs", KB_MAP[b["id"]][1])
    b.setdefault("order", (i + 1) * 10)
    b.setdefault("onSale", True)

# 方案库常用的珠子（示例价位，按市场常见零售估算；正式上线以供应商报价为准）
EXTRA = [
    # (知识库品种, 名称, 材质, 亮色, 暗色, {直径: 单价}, 寓意)
    ("hetian-yu", "和田玉", "stone", "#ece8d6", "#9d9b86", {8: 15, 10: 22}, ["温润", "平安"]),
    ("yueguang-shi", "月光石", "crystal", "#f1f5fa", "#a5b8cf", {6: 4, 8: 6}, ["温柔", "清透"]),
    ("huyan-shi", "虎眼石", "stone", "#d99c3f", "#5a3510", {8: 2, 10: 3, 12: 4}, ["坚定", "勇气"]),
    ("zhenzhu", "珍珠", "stone", "#fbf7f0", "#d6ccbf", {6: 4, 7: 5, 8: 7}, ["优雅", "温柔"]),
    ("putong-manao", "红玛瑙", "stone", "#d44c3b", "#6e1610", {6: 1, 8: 1.5, 10: 2, 12: 3}, ["红火", "吉祥"]),
    ("lv-yusui", "绿玉髓", "stone", "#a3d9a3", "#3f8f55", {8: 6}, ["清新", "生机"]),
    ("lachang-shi", "拉长石", "crystal", "#8d99a8", "#2f3c50", {8: 4, 10: 6}, ["神秘", "沉稳"]),
    ("hailanbao", "海蓝宝", "crystal", "#d2eaf3", "#6aa6c4", {6: 4, 8: 6, 10: 9}, ["清透", "自在"]),
    ("dongling-yu", "东陵玉", "stone", "#79bb8c", "#2c6b45", {8: 1.5, 10: 2}, ["生机", "自然"]),
    ("huang-shuijing", "黄水晶", "crystal", "#fff2b3", "#d6a23a", {8: 3, 10: 4}, ["明亮", "富足"]),
    ("heitan", "黑檀", "wood", "#4c3b2e", "#120c08", {10: 3}, ["沉稳", "内敛"]),
    ("cha-jing", "茶晶", "crystal", "#cbab8c", "#5a3d27", {6: 2, 8: 2.5, 10: 3, 12: 4}, ["沉稳", "内敛"]),
    ("ying-shi", "萤石", "crystal", "#c8b8ee", "#4c8f86", {8: 3}, ["梦幻", "灵动"]),
    ("chansi", "缠丝玛瑙", "stone", "#e8c8aa", "#8a3b20", {10: 4}, ["圆满", "恒久"]),
    ("xiu-yu", "岫玉", "stone", "#d1e4b8", "#6f8f4c", {8: 2}, ["温润", "平安"]),
    ("huangyang", "黄杨木", "wood", "#f1d58c", "#b4842e", {6: 1, 10: 2}, ["质朴", "长寿"]),
    ("tanxiang", "檀香", "wood", "#cb955c", "#6b4220", {8: 3, 12: 5}, ["雅致", "宁静"]),
    ("tao-mu", "桃木", "wood", "#cb8960", "#6a3a20", {6: 0.5}, ["吉祥", "质朴"]),
    ("putao-shi", "葡萄石", "crystal", "#e0f4c2", "#8cbf5a", {8: 5}, ["清新", "温柔"]),
    ("fa-jing", "金发晶", "crystal", "#fff5d2", "#c9a24a", {8: 8, 10: 12}, ["华贵", "明亮"]),
    ("zhanguo-hong", "战国红", "stone", "#e8b24c", "#a3261c", {10: 8}, ["红火", "热烈"]),
    ("tianhe-shi", "天河石", "stone", "#aae3d7", "#3f9c8e", {8: 3}, ["清新", "自在"]),
    ("shuicao", "水草玛瑙", "stone", "#eaf0ea", "#6f8f6a", {8: 2}, ["自然", "生机"]),
    ("fengyan", "凤眼菩提", "bodhi", "#dab68c", "#7a5230", {10: 1, 12: 1.5}, ["吉祥", "古朴"]),
    ("fotou", "佛头三通", "stone", "#d8b48c", "#7a5a32", {12: 6}, ["圆满"]),
]
for kbid, name, mat, c0, c1, sizes, tags in EXTRA:
    for mm, price in sizes.items():
        BEADS.append({"id": f"{kbid}-{mm}", "name": name, "mm": mm, "price": price, "mat": mat, "c": [c0, c1], "tags": tags,
                      "kb": kbid, "attrs": {}, "order": len(BEADS) * 10 + 10, "onSale": True})

# 已有品种补方案常用的尺寸（名字和颜色沿用已有那颗）
MORE_SIZES = {"hy8": {10: 4, 12: 5}, "nh8": {10: 18}, "bj8": {6: 1.5, 10: 3}, "xy8": {10: 1.5}, "jg10": {12: 4},
              "fj8": {6: 2}, "zj8": {10: 5}, "ml10": {8: 12, 12: 26}, "zt10": {12: 6}, "zt8": {6: 2}, "ls8": {10: 8, 12: 10},
              "qj8": {10: 7}, "sp4": {3: 0.5, 6: 1.5}, "gp": {}, "zy6": {8: 14}}
for base, sizes in MORE_SIZES.items():
    b0 = next(b for b in BEADS if b["id"] == base)
    for mm, price in sizes.items():
        BEADS.append({**b0, "id": f"{base}-{mm}", "mm": mm, "price": price, "order": len(BEADS) * 10 + 10})

# 模板存成“开头珠 + 循环花型 + 结尾珠”，前台按每个人的手围补满颗数
TEMPLATES = [
    {"id": "t1", "name": "好运连连", "meaning": "蜜蜡温润富贵，转运珠添一点亮色，黑曜石沉稳压住整串。寓意好运连连。", "special": ["zy6"], "pattern": ["ml10", "hy8", "hy8"], "tail": []},
    {"id": "t2", "name": "甜蜜粉晶", "meaning": "粉晶温柔，草莓晶添甜蜜，银隔珠点亮整串。送女朋友不会错。", "special": ["cm8"], "pattern": ["fj8", "fj8", "sp4", "fj8", "cm8", "sp4"], "tail": []},
    {"id": "t3", "name": "金榜题名", "meaning": "紫水晶寓意智慧，白水晶清透干净，考试季戴上图个好兆头。", "special": [], "pattern": ["zj8", "bj8", "bj8", "sp4"], "tail": []},
    {"id": "t4", "name": "岁岁平安", "meaning": "星月菩提朴素耐看，绿松石寓意平安，适合送长辈或出远门的人。", "special": ["ls6"], "pattern": ["xy8", "xy8", "xy8", "ls6"], "tail": []},
    {"id": "t5", "name": "沉稳之选", "meaning": "小叶紫檀沉稳，南红佛头寓意圆满。男生通勤百搭。", "special": ["ft12", "gp"], "pattern": ["zt10"], "tail": ["gp"]},
    {"id": "t6", "name": "步步高升", "meaning": "青金石深蓝沉稳，寓意事业顺遂，适合升职季和新工作。", "special": ["zy6"], "pattern": ["qj8", "qj8", "qj8", "ls8"], "tail": []},
]
for i, t in enumerate(TEMPLATES):
    t.setdefault("order", (i + 1) * 10)
    t.setdefault("onSale", True)
    t.setdefault("cover", "")

BANNERS = [
    {"id": "b1", "tag": "考试季", "title": "金榜题名手串", "sub": "紫水晶配白水晶，考前戴上安心", "tpl": "t3", "go": "", "newUser": False},
    {"id": "b2", "tag": "新人礼", "title": "首单立减 ¥10", "sub": "自己设计的手串，师傅手工串好寄到家", "tpl": "", "go": "diy", "newUser": True},
    {"id": "b3", "tag": "送礼", "title": "甜蜜粉晶", "sub": "粉晶加草莓晶，送女朋友不会错", "tpl": "t2", "go": "", "newUser": False},
]
for i, b in enumerate(BANNERS):
    b.setdefault("order", (i + 1) * 10)
    b.setdefault("on", True)
