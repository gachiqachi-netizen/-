#!/usr/bin/env python3
"""把 server/contract.py 的契约导出给两个前端。跑法：python3 tools/export_contract.py
生成 miniprogram/utils/contract.js（CommonJS）和 admin-web/src/contract.ts；两个文件都不要手改。
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "server"))

import contract  # noqa: E402

HEADER = "// 自动生成：python3 tools/export_contract.py，不要手改"


def render():
    """返回 [(相对路径, 文件内容)]，不落地；写文件在 main() 里做。"""
    data = json.dumps(contract.payload(), ensure_ascii=False, indent=2, sort_keys=True)
    js = HEADER + "\nmodule.exports = " + data + "\n"
    ts = (HEADER + "\nexport const CONTRACT = " + data + " as const;\n"
          "export type CustomerStatusCode = keyof typeof CONTRACT.customerStatus;\n"
          "export type OpsStatusCode = keyof typeof CONTRACT.opsStatus;\n"
          "export type ActionCode = keyof typeof CONTRACT.actions;\n")
    return [
        (os.path.join("miniprogram", "utils", "contract.js"), js),
        (os.path.join("admin-web", "src", "contract.ts"), ts),
    ]


def main():
    for rel, text in render():
        path = os.path.join(ROOT, rel)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
        print("written", rel)


if __name__ == "__main__":
    main()
