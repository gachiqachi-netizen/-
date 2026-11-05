# Independent hand tracking experiment

Build: `npm ci && npm run build` in this directory. Output: `miniprogram/ar-hand/runtime.js`.

Adapted handpose TypeScript and WeChat platform shim from https://github.com/deepkolos/wxmp-tensorflow (package declares MIT); original model/adapter source carries Google Apache-2.0 headers, retained in vendor files. TensorFlow.js dependencies carry their upstream licenses. Not an official WeChat plugin; no VKSession dependency.

## 模型托管、配置与缓存（T2）

模型来源：TensorFlow.js handpose / TensorFlow Hub，Apache-2.0。下载工具使用官方模型地址，运行时不访问参考作者的测试 CDN。

```sh
python3 tools/hand-tracker/download_models.py
```

下载结果在 `tools/hand-tracker/models/`，约 12.7 MiB；不放进小程序包或 git。本地后端已将这个目录映射到 `/models/`。部署对象存储时上传整个 `handpose/` 目录，保留以下结构：

```text
<modelBase>/handpose/<modelVersion>/
  handdetector/model.json
  handdetector/group1-shard1of2.bin
  handdetector/group1-shard2of2.bin
  handskeleton/model.json
  handskeleton/group1-shard1of2.bin
  handskeleton/group1-shard2of2.bin
  anchors.json
```

实际分片名以官方 `model.json` 的 `weightsManifest` 为准。运行时从 `getApp().globalData.modelBase`、`modelVersion` 读取配置（与 T1 `config.js` 契约一致）。默认版本 `v1`；开发版没有单独设置 `modelBase` 时使用 `apiBase + '/models'`，真机须配置可访问的开发后端。体验和正式版默认占位 `https://static.example.com`，并强制 HTTPS。正式使用前负责人上传文件、改成自己的域名，并在微信后台配置 downloadFile 合法域名。

首次串行下载模型并显示 0–100% 文件进度，全部文件校验完成后写入完成标记。缓存路径是 `wx.env.USER_DATA_PATH/beadloop-handpose/<modelVersion>`，后续优先读取，不发网络请求。完整缓存会验证 JSON、分片存在性和大小；损坏或用户清理缓存后重下。模型内容及来源按版本保持不变；升级文件时修改版本号，旧版本会清理。该缓存自身上限 24 MiB；系统存储不足或超限会明确提示，并提供照片试戴入口。相机画面不会发送至模型服务。

下载及识别初始化超过 20 秒、下载失败或页面无法加载，会显示“改用照片试戴”。100% 表示模型文件准备好，不代表 GPU 初始化已完成；缓存命中不保证所有设备能在一秒内完成 TFJS 初始化。取消/离开页面会中止仍在下载的请求。

### 真机验收步骤

1. 导入 `miniprogram/`，配置可访问的开发 `apiBase`，启动后端；确认 `/models/handpose/v1/anchors.json` 能打开。开发环境关闭域名校验仅用于联调。
2. 清除该小程序本地存储，选一条手串进入实时 AR，观察百分比升至 100%，随后允许相机，检查手部识别；网络面板应有 7 个模型请求。
3. 返回并再次进入，网络面板不应再次下载模型；记录实际初始化耗时，不把模型缓存命中等同于设备识别性能。
4. 临时配置不存在的版本，或断网并清除模型缓存，重新进入；应显示失败或最多 20 秒后的提示，点“改用照片试戴”进入照片页，原设计仍保留。
5. 将 `modelVersion` 改成已上传的新版本，确认重新下载且旧版本缓存清理；通过测试覆盖模拟存储不足，不必在手机上刻意填满存储。
6. 分别在 iOS、Android、HarmonyOS 检查重入、前后台切换、网络中断与照片降级。Node 测试及构建通过不代表这些真机步骤已经完成。

Main package redirects legacy AR entry to ar-hand subpackage. Native camera RGBA frames are copied before async inference. The displayed canvas uses the exact inference frame and coordinate fit; absent hands hide overlay. Wrist scale/tilt remains an estimate, no depth occlusion or physical fit guarantee. HarmonyOS tracking performance is NOT validated by build or Node tests.

Reference commit: `4c7e612bf38401f0753500d5b35dd49ff1a074b8`. Modified the async model wrapper to dispose input tensors on inference errors.

## Device-tools integration regression

Use the developer-tools automation endpoint (default ws://127.0.0.1:9421), select a bracelet first, then `npm run check:devtools`. Override with `WECHAT_AUTOMATOR_URL` if necessary. The test feeds an upstream test image into the *real* loaded TFJS model; it checks positive detection, stable tensor count, empty frame rejection and page re-entry. This is not a substitute for a HarmonyOS camera test.

`fixtures/hands.json` is an RGB-resized copy of TensorFlow's Apache-2.0 test image at https://github.com/tensorflow/tfjs-models/blob/master/hand-pose-detection/test_data/hands.jpg . Do not package test fixtures in the mini program.

2026-11-03 developer-tools validation: hand confidence ~0.93–0.96; repeated processing held at 300 tensors; blank frame hid overlay; re-entry restarted model and camera. Warm empty camera inference ~29–39 ms on the Mac simulator, NOT a mobile performance claim. Native preview build succeeded (main ~907 KB, AR subpackage ~936 KB).

Build tfjs-hand-02: HarmonyOS user confirmed hand recognition, then reported generic 3D failure. Root rendering exception was previously discarded. AR now keeps the overlay mounted (opacity toggles), supplies explicit canvas viewport dimensions, and stops the frame loop after a render failure. Component unavailable events preserve initialization/render phase, message and stack for the next device diagnosis. Do not mark HarmonyOS rendering fixed until device retest.

Build tfjs-hand-03: center-cover camera display and matching coordinate mapping; preview scale defaults to 135% (user adjustment 70–220%, not physical calibration); fixed tilt reduced to 45 degrees; short-angle smoothing; 250 ms lost-track grace; freeze/resume and size controls. Out-of-frame wrists prompt repositioning rather than claiming a visible fit. Devtools replay validated freeze held the frame, scale increased and resume released freeze. Optical autofocus on SGU-AL10 remains unverified; no autofocus API change is claimed.
