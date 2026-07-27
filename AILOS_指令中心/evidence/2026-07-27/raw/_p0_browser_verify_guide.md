# P0-5 浏览器端验证指引（设备指纹风控自然生效）

> 目标：非技术人员按本指引操作，即可复现「同设备首账号可领、次账号被拦、换设备可正常领取」的完整效果，并抓图证明风控对普通用户自然生效（无需任何手动改请求）。

## 0. 准备

- 正式域名入口：`https://yandao.vip/xuewaiyu/billing.html`（言道·雪外语 试用/计费页）
- 测试账号（已加 `test_` 前缀，非真实手机号）：
  - A（首账号）：`test_fp_a` / `FpTest2026`
  - B（次账号）：`test_fp_b` / `FpTest2026`
- 浏览器：Chrome/Edge 均可；需打开「开发者工具 → Network」面板。

## 1. 验证「前端自动携带指纹」（所有 /api 请求）

1. 打开 `https://yandao.vip/xuewaiyu/billing.html`，按 F12 打开开发者工具 → Network。
2. 登录 A 账号（输入 `test_fp_a` / `FpTest2026`）。
3. 页面会自动调用 `/api/billing/status` 等接口。在 Network 面板点击任意 `/api/...` 请求 → 查看 **Request Headers**。
4. **预期**：请求头中包含 `X-Device-Fp: fp_xxxxxxxx_xxxxxxxx`（由前端自动生成并附加，你从未手动填写）。
5. **抓图**：Network 面板该请求的 Headers 截图（证明自动携带）。

## 2. 验证「同设备 首账号可领」

1. 仍用 A 账号登录、同一浏览器、同一设备。
2. 页面「试用时长」区域应显示 `remainingSec > 0`（默认 300 秒），即 A 可领取/使用免费试用。
3. **预期效果**：A 正常使用翻译/拍照等试用功能，扣减来自免费试用（`source: trial`）。

## 3. 验证「同设备 次账号被拦」

1. 在**同一浏览器、同一设备**退出 A，改用 B 账号（`test_fp_b`）登录。
2. 查看 `/api/billing/status` 返回（或页面试用区域）：
   - `trial.deviceRestricted = true`
   - `trial.restrictReason = "DEVICE_TRIAL_CLAIMED"`
   - `trial.remainingSec = 0`
3. **预期效果**：B 无法领取/使用本设备免费试用（因本设备已由 A 领取，终身一次）。尝试扣减会返回 402 `TRANSLATION_TIME_EXHAUSTED`。
4. **抓图**：状态接口返回 JSON 或页面提示截图。

## 4. 验证「换设备可正常领取」

1. 换一个**不同的浏览器或隐身窗口**（等同于新设备指纹），用 B 账号登录。
2. 查看状态：`trial.remainingSec > 0`、`deviceRestricted = false`。
3. **预期效果**：B 在新设备上可正常领取/使用免费试用（正常用户多设备不受影响）。
4. **抓图**：状态接口返回 JSON 截图。

## 5. 判定标准

- 第 1 步出现 `X-Device-Fp` 头 → 前端真实生效（非测试命令专属）。
- 第 2 步 A 可领、第 3 步 B 同设备被拦、第 4 步 B 换设备可领 → 设备维度双绑定防薅生效。
- 任意一步不符即视为未生效，须回退排查 `assets/devicefp.js` 是否被正确加载（页面源码应含 `<script src="/xuewaiyu/assets/devicefp.js"></script>`）。

## 6. 清理提醒（铁律）

`test_fp_a` / `test_fp_b` 为临时验证账号，验证完成后 **24 小时内须清理**（删除账号及其计费记录、清空 `dfp:*` 键）。本环境已预留清理脚本，由值班员执行。
