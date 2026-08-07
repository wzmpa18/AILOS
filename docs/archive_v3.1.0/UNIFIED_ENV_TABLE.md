# AILOS v1.0 Beta 统一环境变量对照表

## 4套打包平台共用环境变量

| 变量名 | 用途 | Codemagic | CODING | APICloud | Jenkins |
|--------|------|-----------|--------|----------|---------|
| `CM_KEYSTORE_BASE64` / `ailos-keystore-path` | 签名文件路径 | ✓(base64) | ✓(凭证) | 后台上传 | ✓(凭证) |
| `CM_KEYSTORE_PASSWORD` / `ailos-keystore-password` | keystore密码 | ✓ | ✓ | 后台填写 | ✓ |
| `CM_KEY_ALIAS` / `ailos-key-alias` | key别名 | ✓ | ✓ | 后台填写 | ✓ |
| `CM_KEY_PASSWORD` / `ailos-key-password` | key密码 | ✓ | ✓ | 后台填写 | ✓ |
| `WECOM_WEBHOOK` / `ailos_notify` | 企业微信通知 | ✓ | ✓(可选) | — | ✓(可选) |

## 统一配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 基线SHA | f13eddb | GitHub main分支 |
| 版本号 | 1.0.0 | versionName |
| 构建号 | 1+ | 自动递增 |
| 包名 | ai.yandao.ailos | 正式业务包名 |
| minSdk | 26 | Android 8.0 |
| targetSdk | 34 | 对齐主流 |
| 签名方案 | v1+v2+v3 | 全兼容 |
| 默认域名 | https://yandao.vip/xuewaiyu/ | buildConfig注入 |
| 后端API | https://yandao.vip/xuewaiyu/api/ | |
| 健康检查 | /api/health | 200 healthy |
| 会员套餐 | /api/membership/plans | 3个套餐 |
| APK命名 | AILOS_言道学外语_v1.0.0_Release.apk | 标准命名 |
| Debug命名 | AILOS_言道学外语_v1.0.0_Debug.apk | 标准命名 |

## 4套方案优劣对比

| 维度 | Codemagic | 腾讯CODING | APICloud | 自建Jenkins |
|------|-----------|-----------|----------|-------------|
| 访问性 | 境外不稳定 | **国内免费** | 网页后台 | **私有化** |
| 构建速度 | 5-10分钟 | 3-8分钟 | 2-5分钟 | 3-5分钟 |
| 配置复杂度 | 中 | 中 | **低** | 高 |
| 自动化 | ✓ | ✓ | ✗(手动) | ✓ |
| 数据隐私 | 境外 | 腾讯云 | APICloud | **本机** |
| 推荐场景 | 备选 | **主力** | 快速内测 | 高频迭代 |
