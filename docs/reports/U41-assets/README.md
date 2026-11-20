# U41 落珠沿轨道滑入交付

分支：`agent/U41-bead-slide`。录屏：[bead-slide.mp4](bead-slide.mp4)，1.79 秒，录自微信开发者工具的工作台，展示第 7 颗珠子加入时的轨道滑入。测试使用开发者工具离线目录中的小叶紫檀珠；画面中的接口域名提示不影响本地加珠。

## 实现

- `miniprogram/components/bracelet/index.js`：按托盘实际圆心、半径和目标坐标生成从 6 点钟顺时针抵达目标的关键帧；420ms，时间曲线采样自 `cubic-bezier(0,0,.2,1)`，前 1/3 时间透明度由 0 到 1。连续加珠时清掉上一段动画并以序号防止旧回调结束新动画；不支持动画或启用减少动态效果时直接呈现。
- `miniprogram/components/bracelet/index.wxml`、`index.wxss`：只让新加入的珠子成为动画目标；旧珠保持原位。
- `miniprogram/pages/diy/diy.js`、`diy.wxml`、`diy.wxss`：加珠时传递动画序号，移除旧 `.bead-flight` 飞入视图、样式和计时器；数量、金额、提示及音效仍走原有更新流程。
- `miniprogram/tests/u41-bead-slide.test.js`：覆盖顺时针角度跨界、连续加珠回调隔离、减少动态效果和不支持动画的回退。

## 验证

| 命令 | 结果 |
| --- | --- |
| `python3 -m unittest discover -s server/tests` | Ran 745 tests，OK (skipped=10) |
| `node --test miniprogram/tests/*.test.js` | 397 tests，397 pass，0 fail |
| `python3 kb/validate.py` | 已填 202/202 种，有问题 0 条，缺 0 种 |

在微信开发者工具的 iPhone 12/13 mini 模拟器中点击珠子后，已观察到计数由 6 增至 7、金额由 ¥18 增至 ¥21，新珠沿轨道出现。录屏文件已核验时长低于 3 秒。
