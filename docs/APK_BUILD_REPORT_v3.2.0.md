# APK 构建报告 v3.2.0

| 项目 | 值 |
|------|------|
| 文档版本 | v3.2.0 |
| 报告类型 | 云构建（Release） |
| 构建平台 | Codemagic (mac_mini_m2) |
| 生成日期 | 2026-08-07 |
| 状态 | 正式发布版（Production） |

---

## 目录

1. [构建概述](#1-构建概述)
2. [构建源校验](#2-构建源校验)
3. [构建配置详情](#3-构建配置详情)
4. [权限清单](#4-权限清单)
5. [签名信息](#5-签名信息)
6. [构建流程](#6-构建流程)
7. [产物校验](#7-产物校验)
8. [环境变量配置](#8-环境变量配置)
9. [构建日志归档](#9-构建日志归档)
10. [合规声明](#10-合规声明)

---

## 1. 构建概述

本次构建为「研道学习（yandao_learn）」Android 客户端的 **v3.2.0 正式发布版**，通过 Codemagic 云构建平台（mac_mini_m2 实例）自动化执行。构建基于 Git 标签 `v3.2.0-production` 触发，采用 Gradle Release 构建类型，启用了代码混淆与资源压缩，确保最终 APK 体积精简且符合发布安全规范。

| 属性 | 值 |
|------|------|
| 应用名称 | 研道学习（yandao_learn） |
| 包名（applicationId） | `ai.yandao.ailos` |
| 版本名称（versionName） | 3.2.0 |
| 版本号（versionCode） | 320 |
| 构建类型 | Release |
| APK 命名规范 | `yandao_learn_v3.2.0_release.apk` |
| 构建源 | Git 标签 `v3.2.0-production` |
| 提交哈希 | `edb1537` |
| 构建平台 | Codemagic (mac_mini_m2) |
| BASE_URL | `https://yandao.vip/xuewaiyu/` |
| API_BASE_URL | `https://yandao.vip/xuewaiyu/api/` |

---

## 2. 构建源校验

### 2.1 Git 标签信息

本次构建严格基于 Git 标签触发，确保产物与源代码版本一一对应，杜绝本地未提交变更对构建结果的影响。

| 校验项 | 值 |
|------|------|
| Git 标签 | `v3.2.0-production` |
| 提交哈希（Commit SHA） | `edb1537` |
| 分支来源 | production（生产分支） |
| 构建触发方式 | 标签推送自动触发 |

### 2.2 校验说明

- 构建系统在拉取代码后自动执行 `git describe --tags` 确认当前 HEAD 指向 `v3.2.0-production` 标签。
- 提交哈希 `edb1537` 已写入 `build_manifest_v3.2.0.json`，供后续溯源与审计使用。
- 构建过程中若检测到工作区存在未提交变更（dirty state），将立即中止构建并上报错误。

---

## 3. 构建配置详情

### 3.1 SDK 版本配置

| 配置项 | 值 | 说明 |
|------|------|------|
| minSdk | 26 | 最低支持 Android 8.0 (Oreo) |
| targetSdk | 34 | 目标 Android 14 (API 34) |
| compileSdk | 34 | 编译 SDK Android 14 (API 34) |

### 3.2 Build Type 配置（Release）

| 配置项 | 值 | 说明 |
|------|------|------|
| minifyEnabled | `true` | 启用代码混淆（ProGuard/R8） |
| shrinkResources | `true` | 启用资源压缩，移除未引用资源 |
| debuggable | `false` | 关闭调试模式 |
| 构建命令 | `./gradlew clean assembleRelease --stacktrace` | 清理并构建 Release 包 |

### 3.3 ProGuard 规则

| 规则类别 | 内容 | 说明 |
|------|------|------|
| WebView 桥接接口保留 | 保留 `WebAppInterface` 类 | JavaScript 桥接接口，禁止混淆 |
| WebView 桥接接口保留 | 保留 `MainActivity` 中的桥接方法 | 确保前端 JS 可正常调用原生方法 |
| 日志移除 | 移除 `android.util.Log` 的 `v/d/i` 级别调用 | 移除 debug 日志，防止敏感信息泄露 |
| 通用保留 | 保留泛型签名、注解、枚举 | 避免反射调用失败 |

### 3.4 网络安全配置

| 配置项 | 值 | 说明 |
|------|------|------|
| 配置文件 | `network_security_config.xml` | 网络安全策略文件 |
| cleartextTrafficPermitted | `false` | 禁止明文 HTTP 流量，仅允许 HTTPS |
| 证书校验 | 启用 | 强制校验服务端 TLS 证书 |

---

## 4. 权限清单

### 4.1 应用权限（uses-permission）

| 权限 | 用途说明 | 备注 |
|------|------|------|
| `android.permission.INTERNET` | 网络访问，与后端 API 及 WebView 页面通信 | 基础权限 |
| `android.permission.ACCESS_NETWORK_STATE` | 检测网络连接状态，实现离线提示 | 基础权限 |
| `android.permission.CAMERA` | 拍照功能（如作业拍照上传） | 运行时申请 |
| `android.permission.RECORD_AUDIO` | 语音录制（如口语练习录音） | 运行时申请 |
| `android.permission.READ_EXTERNAL_STORAGE` | 读取外部存储（图片选取等） | `maxSdkVersion=32`（Android 12 及以下） |
| `android.permission.READ_MEDIA_IMAGES` | 读取媒体图片（Android 13+） | 替代 READ_EXTERNAL_STORAGE（API 33+） |
| `android.permission.POST_NOTIFICATIONS` | 推送通知（Android 13+） | 运行时申请（API 33+） |

### 4.2 硬件特性声明（uses-feature）

| 硬件特性 | required | 说明 |
|------|------|------|
| `android.hardware.camera` | `false` | 相机（可选，无相机设备仍可安装） |
| `android.hardware.camera.autofocus` | `false` | 自动对焦（可选） |
| `android.hardware.microphone` | `false` | 麦克风（可选，无麦克风设备仍可安装） |

> 所有硬件特性均声明为 `required=false`，确保应用可在无对应硬件的设备上正常安装，最大化设备兼容性。

---

## 5. 签名信息

### 5.1 签名方案

| 配置项 | 值 | 说明 |
|------|------|------|
| 签名方案 | V2 签名 | `v2SigningEnabled=true` |
| V1 签名（JAR 签名） | 随 V2 自动启用 | 保证向下兼容 |
| Keystore 类型 | PKCS12 | 现代密钥库格式 |
| Keystore 加密算法 | AES-256-CBC | 密钥库文件加密 |
| Keystore 完整性校验 | SHA-256 | 防篡改校验 |

### 5.2 签名别名

| 配置项 | 值 |
|------|------|
| 签名别名（Alias） | `yandao` |
| 密钥有效期 | 至 2050 年 |
| 密钥算法 | RSA |
| 密钥长度 | 2048 位 |

### 5.3 签名验证

构建完成后，系统自动执行签名验证，确认 APK 签名方案与配置一致：

```
apksigner verify --verbose yandao_learn_v3.2.0_release.apk
```

预期输出包含 `Verified using v2 scheme (APK Signature Scheme v2): true`。

---

## 6. 构建流程

### 6.1 流程总览

```
┌─────────────────────┐
│  1. Decode Keystore  │  ← 从 Codemagic 环境变量解码 Base64 keystore
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. Config SDK       │  ← 配置 minSdk/targetSdk/compileSdk
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. Build Release    │  ← ./gradlew clean assembleRelease --stacktrace
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. Verify Signature │  ← apksigner verify 验证 V2 签名
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  5. Hash and Rename  │  ← 计算 MD5/SHA256，重命名 APK，生成 manifest
└─────────────────────┘
```

### 6.2 各步骤详情

#### 步骤 1：Decode Keystore（解码密钥库）

将存储在 Codemagic 环境变量中的 Base64 编码的 PKCS12 keystore 解码为本地文件，供 Gradle 签名配置使用。解码后的 keystore 文件仅存在于构建临时目录，构建结束后自动清除。

#### 步骤 2：Config SDK（配置 SDK 版本）

读取 `build.gradle` 中的 SDK 版本配置，确认以下参数：

| 参数 | 值 |
|------|------|
| minSdk | 26 |
| targetSdk | 34 |
| compileSdk | 34 |

同时加载 `network_security_config.xml`，确认 `cleartextTrafficPermitted=false`。

#### 步骤 3：Build Release（构建 Release 包）

执行构建命令：

```bash
./gradlew clean assembleRelease --stacktrace
```

该命令依次执行：
1. **clean**：清理上一次构建产物
2. **assembleRelease**：执行 Release 构建任务链（编译 → 混淆 → 资源压缩 → 签名 → 打包）
3. **--stacktrace**：输出完整异常堆栈，便于排查构建失败

构建过程中启用了 ProGuard 混淆（`minifyEnabled=true`）与资源压缩（`shrinkResources=true`），同时应用 ProGuard 规则保留 WebView 桥接接口并移除 debug 日志。

#### 步骤 4：Verify Signature（验证签名）

使用 `apksigner` 工具对生成的 APK 进行签名验证，确认 V2 签名方案生效且签名完整。

#### 步骤 5：Hash and Rename（哈希计算与重命名）

对最终 APK 计算哈希值，并按命名规范重命名产物文件，同时生成 `build_manifest_v3.2.0.json`。

---

## 7. 产物校验

### 7.1 构建产物清单

本次构建共产出以下文件：

| 产物文件 | 说明 | 用途 |
|------|------|------|
| `yandao_learn_v3.2.0_release.apk` | 最终发布 APK | 应用分发与安装 |
| `build_manifest_v3.2.0.json` | 构建清单文件 | 记录构建元数据、版本号、哈希值 |
| `mapping.txt` | ProGuard 混淆映射表 | 崩溃堆栈还原（Crash 符号化） |

### 7.2 哈希计算

构建完成后，系统自动对 APK 文件计算 MD5 与 SHA256 哈希值，并将结果写入 `build_manifest_v3.2.0.json`。

| 哈希算法 | 值 |
|------|------|
| MD5 | 构建后自动生成 |
| SHA256 | 构建后自动生成 |

> 注：以上哈希值在 Codemagic 云端构建完成后自动计算并写入 build_manifest。本次报告撰写时构建尚未在本地执行，故标记为「构建后自动生成」。

### 7.3 build_manifest 字段说明

`build_manifest_v3.2.0.json` 包含以下核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `versionName` | string | 版本名称（3.2.0） |
| `versionCode` | int | 版本号（320） |
| `applicationId` | string | 包名（ai.yandao.ailos） |
| `gitTag` | string | Git 标签（v3.2.0-production） |
| `commitHash` | string | 提交哈希（edb1537） |
| `buildPlatform` | string | 构建平台（Codemagic mac_mini_m2） |
| `buildDate` | string | 构建时间（ISO 8601） |
| `apkFileName` | string | APK 文件名 |
| `md5` | string | APK 的 MD5 哈希 |
| `sha256` | string | APK 的 SHA256 哈希 |
| `signingScheme` | string | 签名方案（V2） |
| `minSdk` | int | 最低 SDK（26） |
| `targetSdk` | int | 目标 SDK（34） |

---

## 8. 环境变量配置

### 8.1 签名相关环境变量

签名凭据通过 Codemagic 环境变量组（Environment Variable Group）注入，不硬编码于代码仓库中，确保密钥安全。

| 环境变量名 | 用途 | 存储方式 | 说明 |
|------|------|------|------|
| `KEYSTORE_PASSWORD` | Keystore 解密密码 | Codemagic 加密环境变量 | 用于解锁 PKCS12 keystore 文件 |
| `KEY_ALIAS` | 签名密钥别名 | Codemagic 加密环境变量 | 值为 `yandao` |
| `KEY_PASSWORD` | 签名密钥密码 | Codemagic 加密环境变量 | 用于解锁指定 alias 的私钥 |

### 8.2 注入方式

环境变量通过 Codemagic 的环境变量组（Environment Variable Group）机制注入，`codemagic.yaml` 中引用方式如下：

```yaml
environment:
  groups:
    - keystore_credentials
  vars:
    KEYSTORE_PASSWORD: $KEYSTORE_PASSWORD
    KEY_ALIAS: $KEY_ALIAS
    KEY_PASSWORD: $KEY_PASSWORD
```

### 8.3 安全注意事项

- 签名密钥库文件以 Base64 编码存储于 Codemagic 加密变量中，构建时解码到临时目录。
- 所有密码类环境变量均标记为敏感（Sensitive），构建日志中自动脱敏显示为 `***`。
- 构建结束后，临时解码的 keystore 文件随构建实例销毁而清除，不会持久化。

---

## 9. 构建日志归档

### 9.1 日志归档策略

| 日志类型 | 归档位置 | 保留策略 |
|------|------|------|
| Codemagic 构建日志 | Codemagic 控制台 → Build History | 90 天 |
| Gradle 构建日志 | 构建产物 artifacts（`build_logs.zip`） | 随构建记录保留 |
| ProGuard 配置 | `proguard-rules.pro`（代码仓库） | 永久（版本控制） |
| mapping.txt | 构建产物 artifacts | 永久（崩溃分析依赖） |

### 9.2 关键日志检查点

构建完成后，需确认以下关键日志节点均通过：

| 检查点 | 期望状态 | 日志关键词 |
|------|------|------|
| Git 标签校验 | 通过 | `HEAD is at v3.2.0-production` |
| Keystore 解码 | 通过 | `Keystore decoded successfully` |
| Gradle 构建完成 | `BUILD SUCCESSFUL` | `BUILD SUCCESSFUL` |
| ProGuard 混淆 | 通过 | `R8: Shrinking...` → 无 error |
| 资源压缩 | 通过 | `Removed unused resources` |
| 签名验证 | 通过 | `Verified using v2 scheme` |
| 哈希计算 | 通过 | `MD5:` / `SHA256:` |

---

## 10. 合规声明

### 10.1 第三方 SDK 声明

| 类别 | 状态 | 说明 |
|------|------|------|
| 第三方统计 SDK | 未集成 | 本应用未集成任何第三方统计 SDK（如友盟、神策等） |
| 第三方广告 SDK | 未集成 | 本应用未集成任何第三方广告 SDK |
| 第三方推送 SDK | 未集成 | 使用系统级通知（POST_NOTIFICATIONS），未集成第三方推送 |
| 崩溃收集 SDK | 未集成 | 依赖 mapping.txt 进行本地崩溃分析 |

### 10.2 隐私合规

| 合规项 | 状态 | 说明 |
|------|------|------|
| 明文流量 | 禁止 | `cleartextTrafficPermitted=false`，仅允许 HTTPS |
| Debug 日志 | 已移除 | ProGuard 规则移除 `Log.v/d/i` 调用 |
| 硬件特性声明 | 可选 | 所有 `uses-feature` 均为 `required=false` |
| 存储权限 | 分版本适配 | Android 13+ 使用 `READ_MEDIA_IMAGES`，Android 12 及以下使用 `READ_EXTERNAL_STORAGE` |
| 运行时权限 | 按需申请 | CAMERA、RECORD_AUDIO、POST_NOTIFICATIONS 均为运行时动态申请 |

### 10.3 签名合规

| 合规项 | 状态 | 说明 |
|------|------|------|
| 签名方案 | V2 签名 | 符合 Google Play 签名要求 |
| 密钥管理 | 环境变量隔离 | 签名密钥通过 Codemagic 加密环境变量注入，不入库 |
| 签名验证 | 构建后自动校验 | 确保每个发布 APK 签名完整有效 |

### 10.4 版本可追溯性

| 追溯项 | 记录方式 |
|------|------|
| 源代码版本 | Git 标签 `v3.2.0-production` + 提交哈希 `edb1537` |
| 构建环境 | Codemagic (mac_mini_m2) 构建实例 ID |
| 构建产物哈希 | MD5 + SHA256（写入 build_manifest_v3.2.0.json） |
| 混淆映射 | mapping.txt 归档保存 |

---

> **报告结论**：本次 v3.2.0 版本构建基于 Git 标签 `v3.2.0-production`（提交 `edb1537`）在 Codemagic (mac_mini_m2) 平台执行，采用 V2 签名方案、PKCS12 keystore，启用代码混淆与资源压缩。应用未集成任何第三方统计 SDK 或广告 SDK，网络安全配置仅允许 HTTPS 流量，符合发布安全与隐私合规要求。构建产物包括 APK、build_manifest 及 mapping.txt，哈希值在云端构建后自动计算并写入清单文件。

---

*文档结束 — APK 构建报告 v3.2.0*
