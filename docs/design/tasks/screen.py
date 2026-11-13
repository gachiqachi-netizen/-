"""只取设计稿里的一屏，给执行 agent 用（整份稿子 20 多万字，不要整份读）。

用法（在仓库根目录）：
    python3 docs/design/tasks/screen.py s65     # 小程序稿 mockups-final.html 第 65 屏
    python3 docs/design/tasks/screen.py A17     # 后台稿 mockups-admin.html 的 A17
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent


def screen(key):
    admin = key[0] in "Aa"
    key = key.upper() if admin else key.lower()
    path = HERE / ("mockups-admin.html" if admin else "mockups-final.html")
    s = path.read_text(encoding="utf-8")
    mark = f"<b>{key}</b>" if admin else f'id="{key}"'
    i = s.find(mark)
    if i < 0:
        return None
    j = s.find('<div class="fig">' if admin else "<figure", i + len(mark))
    return s[i:j if j > 0 else len(s)]


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = screen(sys.argv[1])
    if out is None:
        sys.exit(f"没有这一屏：{sys.argv[1]}（小程序稿写 s01–s87，后台稿写 A01–A23）")
    print(out)
