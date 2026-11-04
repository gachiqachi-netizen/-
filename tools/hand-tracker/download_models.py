"""从 TensorFlow Hub 官方地址下载手部识别模型（handpose，Apache-2.0），放到本地文件夹，之后整个上传到自己的对象存储。

用法：python3 tools/hand-tracker/download_models.py
结果：tools/hand-tracker/models/handpose/v1/ 下有 handdetector/、handskeleton/、anchors.json（这个目录不进 git）
"""
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "models", "handpose", "v1")
MODELS = {
    "handdetector": "https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1",
    "handskeleton": "https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1",
}
ANCHORS = "https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file"


def fetch(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as r, open(path, "wb") as f:
        f.write(r.read())
    return os.path.getsize(path)


total = 0
for name, base in MODELS.items():
    folder = os.path.join(OUT, name)
    total += fetch(f"{base}/model.json?tfjs-format=file", os.path.join(folder, "model.json"))
    with open(os.path.join(folder, "model.json"), encoding="utf-8") as f:
        manifest = json.load(f).get("weightsManifest", [])
    for group in manifest:
        for shard in group.get("paths", []):
            size = fetch(f"{base}/{shard}?tfjs-format=file", os.path.join(folder, shard))
            total += size
            print(f"{name}/{shard}  {size / 1024:.0f} KB")
total += fetch(ANCHORS, os.path.join(OUT, "anchors.json"))
print(f"完成：{OUT}，共 {total / 1024 / 1024:.1f} MB")
