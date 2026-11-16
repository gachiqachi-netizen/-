# AI1 交付报告

分支：agent/AI1-ai-settings-api　最后一个功能提交：9fdc19b

## 1. 步骤

| 卡上的步骤 | 做了 / 没做 | 在哪 |
| --- | --- | --- |
| 1. 设置存在 `settings` 表 `id = "ai"` | 做了；保留开关、服务商、模型、修改人和时间；只能选已配置服务商 | `server/ai_settings.py` |
| 2. `ai.provider()` 先看这份设置 | 做了；开关分别控制 AI 配和拍照，服务商及模型优先用后台设置 | `server/ai/__init__.py` |
| 3. 接口（权限 `manage_accounts`） | 做了；GET、PUT、测试、用量四个接口 | `server/routes/ai_settings.py` |
| 4. 测试 | 做了；关开关、未配置服务商、密钥不泄漏、假服务商测试和用量汇总 | `server/tests/test_ai_settings.py` |

## 2. 验收

| 验收项 | 结果 | 证据 |
| --- | --- | --- |
| AI 配和拍照分别关闭，另一个功能仍可用 | 通过 | `test_ai_settings.py::test_disabled_design_falls_back_and_photo_gate_is_independent` |
| 参数错误返回中文，不出现字段名 | 通过 | `test_ai_settings.py::test_validation_errors_are_chinese_without_field_names` |
| 未配密钥不可选 | 通过 | `test_ai_settings.py::test_unconfigured_provider_is_rejected` |
| 后台指定服务商及模型覆盖环境默认值 | 通过 | `test_ai_settings.py::test_saved_provider_and_model_override_environment_default` |
| 后台不返回完整密钥 | 通过 | `test_ai_settings.py::test_get_never_exposes_full_key_and_put_audits` |
| 测试调用不写 AI 对话记录 | 通过 | `test_ai_settings.py::test_test_endpoint_uses_fake_provider_without_log` |
| 最近 7 天调用、失败和平均耗时 | 通过 | `test_ai_settings.py::test_usage_aggregates_failures_and_elapsed` |
| 拍照调用写入用量且不保存图片内容 | 通过 | `test_ai_settings.py::test_photo_provider_records_usage_without_image_or_prompt` |

## 3. 改了的文件

`git diff --stat origin/integration/2026-11...HEAD`：

```text
 docs/reports/AI1.md              |  68 ++++++++++++++++++++++
 server/ai/__init__.py            |  31 ++++++++--
 server/ai_settings.py            |  92 +++++++++++++++++++++++++++++
 server/routes/ai_settings.py     |  72 +++++++++++++++++++++++
 server/tests/test_ai_settings.py | 124 +++++++++++++++++++++++++++++++++++++++
 5 files changed, 382 insertions(+), 5 deletions(-)
```

## 4. 测试

- `python3 -m unittest discover -s server/tests`：Ran 627 tests in 90.054s，OK (skipped=7)。后端开工前 619 → 现在 627。
- `node --test miniprogram/tests/*.test.js`：tests 292，pass 292，fail 0。开工前 292 → 现在 292。
- `python3 kb/validate.py`：已填 200/200 种，有问题 0 条，缺 0 种。
- 新增八个测试：`test_disabled_design_falls_back_and_photo_gate_is_independent` 验证双向开关，`test_validation_errors_are_chinese_without_field_names` 验证中文报错，`test_unconfigured_provider_is_rejected` 验证密钥门槛，`test_saved_provider_and_model_override_environment_default` 验证选择优先级，`test_get_never_exposes_full_key_and_put_audits` 验证脱敏及审计，`test_test_endpoint_uses_fake_provider_without_log` 验证测试调用，`test_usage_aggregates_failures_and_elapsed` 验证汇总，`test_photo_provider_records_usage_without_image_or_prompt` 验证拍照用量及隐私。
- 未修改旧测试断言。

## 5. 自查（命令和输出）

- `git diff --check`：无输出。
- `git log --oneline origin/integration/2026-11..HEAD`：新增 `9fdc19b AI1:`；此前 `4291440 AI1:`、`bcb7377 AI1:`、`552bb8b AI1:`、`1429937 AI1:`、`7ed4b81 AI1:`、`a3410ec AI1:`、`dad0b35 AI1:`、`f61cd3d AI1:`。
- `GET /api/admin/ai-settings`：需 `manage_accounts`；返回开关、服务商、模型、更新时间，以及每家是否配置、密钥末四位。
- `PUT /api/admin/ai-settings`：需 `manage_accounts`；接收开关、服务商、模型；返回保存后的设置及配置状态，写审计。
- `POST /api/admin/ai-settings/test`：需 `manage_accounts`；无需请求体；返回 `success`、`elapsedMs`、`model`，失败时返回通用错误；不写对话日志。
- `GET /api/admin/ai-settings/usage?days=7`：需 `manage_accounts`；返回逐日 AI 配和拍照 `calls`、`failures`、`avgElapsedMs`。

## 6. 没做 / 没验证 / 偏离卡片

- 本卡新增拍照调用用量记录；历史拍照请求没有日志，历史日期的拍照列仍为 0。
- 未在真实模型环境下执行测试接口；单元测试使用假服务商。
- 审核后 `photo()` 显式传 `feature="photo"`；其他 AI 入口继续使用默认的 `design`。

## 7. 审核修改（打回后才有）

| 审核意见编号 | 怎么改的 | 提交 hash |
| --- | --- | --- |
| 1 | `provider(feature="design" 或 "photo")` 显式选功能；`photo()` 传 `photo`；补双向开关测试 | `9fdc19b` |
| 2 | 校验错误改中文文案，不露字段名；补逐项断言 | `9fdc19b` |
