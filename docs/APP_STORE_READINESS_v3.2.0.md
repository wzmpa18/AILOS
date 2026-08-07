# 言道外语 APP 上架准备清单 v3.2.0

> **文档版本**：v3.2.0
> **适用版本**：v3.2.0（versionCode=320）
> **文档目的**：作为 v3.2.0 版本提交应用商店前的完整自检依据，覆盖应用基本信息、权限说明、隐私合规要点、商店素材及上架检查清单。
> **适用平台**：国内主流应用商店（华为、小米、OPPO、vivo、应用宝等）及 Google Play
> **维护说明**：本清单基于 `android-shell/` 实际工程配置核对，所有条目均与 `AndroidManifest.xml`、`build.gradle`、`network_security_config.xml` 一一对应。

---

## 目录

1. [应用基本信息](#1-应用基本信息)
2. [权限说明表](#2-权限说明表)
3. [隐私合规要点](#3-隐私合规要点)
4. [应用商店素材清单](#4-应用商店素材清单)
5. [上架检查清单](#5-上架检查清单)
6. [附录：版本与配置校验记录](#6-附录版本与配置校验记录)

---

## 1. 应用基本信息

| 项目 | 内容 |
| --- | --- |
| 应用名称 | 言道外语 |
| 包名（applicationId） | `ai.yandao.ailos` |
| 版本号（versionName） | 3.2.0 |
| 版本码（versionCode） | 320 |
| 最低系统版本（minSdk） | Android 8.0（API 26） |
| 目标 SDK（targetSdk） | 34（Android 14） |
| 编译 SDK（compileSdk） | 34 |
| 应用类型 | 教育类 |
| 应用描述 | 多语言学习平台，提供词汇练习、语法阅读、考级模考、拍照翻译、社交互动等功能 |
| 主 Activity | `ai.yandao.ailos.MainActivity` |
| 应用形态 | 原生外壳（WebView 容器）+ H5 业务前端 |
| 深度链接（Deep Link） | `https://yandao.vip/xuewaiyu`（App Links，`autoVerify=true`） |
| 生产域名 | `https://yandao.vip/xuewaiyu/` |

### 1.1 版本说明

- **versionName=3.2.0**：面向用户展示的版本号。
- **versionCode=320**：单调递增的内部版本号，用于应用商店判断升级关系。3.2.0 对应 320，遵循「主版本×100 + 次版本×10 + 修订版本」的编码规则。
- 自 v3.1.0（versionCode=310）升级而来，本版本主要新增 / 完善功能详见发布说明。

---

## 2. 权限说明表

以下权限均已在 `AndroidManifest.xml` 中声明，并与业务功能一一对应。每项权限均说明：**权限名称、使用场景、是否必须、隐私协议对应条款**。

| 序号 | 权限名称 | 使用场景 | 是否必须 | 隐私协议对应条款 |
| :--: | --- | --- | :--: | --- |
| 1 | `INTERNET` | 网络访问，所有功能（H5 加载、接口请求）的基础 | 必须 | 第 3.1 条 |
| 2 | `ACCESS_NETWORK_STATE` | 网络状态检测，用于页面加载优化与离线提示 | 必须 | 第 3.1 条 |
| 3 | `CAMERA` | 相机，拍照翻译功能调用相机拍摄待翻译内容 | 可选（使用翻译时需要） | 第 3.2 条 |
| 4 | `RECORD_AUDIO` | 录音，语音对话功能录制用户语音 | 可选（使用语音时需要） | 第 3.2 条 |
| 5 | `READ_EXTERNAL_STORAGE` | 读取外部存储，图片上传（Android 12 及以下，`maxSdkVersion=32`） | 可选 | 第 3.3 条 |
| 6 | `READ_MEDIA_IMAGES` | 读取媒体图片，图片上传（Android 13+） | 可选 | 第 3.3 条 |
| 7 | `POST_NOTIFICATIONS` | 通知，学习提醒推送（Android 13+ 需运行时申请） | 可选 | 第 3.4 条 |

### 2.1 硬件特性声明（非权限）

以下 `uses-feature` 声明均为非强制（`required="false"`），不阻止未配备对应硬件的设备安装：

| 硬件特性 | 说明 | required |
| --- | --- | :--: |
| `android.hardware.camera` | 相机 | false |
| `android.hardware.camera.autofocus` | 相机自动对焦 | false |
| `android.hardware.microphone` | 麦克风 | false |

### 2.2 权限申请策略说明

- **必须权限**（INTERNET、ACCESS_NETWORK_STATE）：为普通权限，安装时自动授予，无需运行时弹窗。
- **可选权限**（CAMERA、RECORD_AUDIO、READ_EXTERNAL_STORAGE、READ_MEDIA_IMAGES、POST_NOTIFICATIONS）：为危险/运行时权限，遵循「**先说明、后申请**」原则：
  1. 在调用对应功能前，先弹出**应用内权限说明弹窗**，向用户解释为何需要该权限；
  2. 用户点击「同意」后，再触发系统权限授权弹窗；
  3. 用户拒绝授权时，对应功能不可用，但不影响应用其他功能正常使用。
- **READ_EXTERNAL_STORAGE** 仅在 Android 12（API 32）及以下生效，Android 13+ 改用 `READ_MEDIA_IMAGES`，两者在隐私协议中归并于第 3.3 条统一说明。

---

## 3. 隐私合规要点

本应用严格遵守《个人信息保护法》《App 违法违规收集使用个人信息行为认定方法》及各应用商店隐私合规审核要求。

### 3.1 首次启动隐私协议弹窗

- **首次启动**应用时，在 `MainActivity` 中弹出**隐私协议弹窗**，展示《用户协议》与《隐私政策》摘要。
- 用户**同意**后，方可加载 H5 业务内容并发起网络请求。
- 用户**拒绝**或未操作时，不加载任何业务内容，不采集任何个人信息。
- 用户同意状态本地持久化，后续启动不再重复弹窗。

### 3.2 权限调用前置说明

- 所有运行时权限在申请前，均弹出**应用内权限说明弹窗**，说明权限用途及拒绝影响。
- 不存在「未说明即申请」或「捆绑申请无关权限」的情况。

### 3.3 不采集的敏感信息（负面清单）

本应用**明确不**收集以下信息：

- **不收集用户位置信息**（未声明 `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`）。
- **不读取通讯录**（未声明 `READ_CONTACTS`）。
- **不读取短信**（未声明 `READ_SMS`）。
- **不安装其他应用**（未声明 `REQUEST_INSTALL_PACKAGES`）。
- **不读取通话记录**（未声明 `READ_CALL_LOG`）。
- **不获取设备唯一标识**（IMEI / OAID / MAC 地址等）用于用户追踪。

### 3.4 第三方 SDK 情况

- **无第三方统计 SDK**（不集成友盟、神策、百度统计等）。
- **无第三方广告 SDK**（不集成穿山甲、优量汇、快手广告等）。
- 仅依赖基础 AndroidX / Material 组件（见 `build.gradle` 依赖），无数据采集行为。

### 3.5 网络安全配置

- **仅允许 HTTPS**：`network_security_config.xml` 中 `cleartextTrafficPermitted="false"`，明文流量被禁止。
- `AndroidManifest.xml` 中 `android:usesCleartextTraffic="false"`，双重保障不使用明文 HTTP。
- 所有网络请求均通过 `https://yandao.vip` 域名进行。

### 3.6 数据备份保护

| 配置项 | 取值 | 说明 |
| --- | :--: | --- |
| `allowBackup` | `false` | 禁止应用数据通过 `adb backup` 备份 |
| `fullBackupContent` | `false` | 禁止全量备份 |
| `dataExtractionRules` | 排除 root 域 | Android 12+ 设备迁移时排除全部数据 |

### 3.7 隐私合规自查结论

- 权限声明与业务功能一一对应，无冗余权限。
- 每项权限在《隐私政策》中均有对应条款说明。
- 不存在「自启动」「关联启动」未告知行为。
- 不存在「后台静默采集」行为。

---

## 4. 应用商店素材清单

### 4.1 应用图标

| 项目 | 内容 |
| --- | --- |
| 图标设计 | 鹦鹉头像 |
| 自适应图标 | `ic_launcher.xml`（`mipmap-anydpi-v26/`） |
| 圆形图标 | `ic_launcher_round.xml`（`mipmap-anydpi-v26/`） |
| 前景图层 | `ic_launcher_foreground.xml`（`drawable/`） |
| 背景色 | `ic_launcher_background`（`colors.xml`） |
| Manifest 引用 | `android:icon="@mipmap/ic_launcher"` + `android:roundIcon="@mipmap/ic_launcher_round"` |

> **注意**：自适应图标需同时提供 `mipmap-` 各密度目录的 PNG 资源（mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi）作为 Android 8.0 以下设备回退。上架前需确认各密度资源已生成且鹦鹉头像清晰可辨。

### 4.2 应用名称

- **应用名称**：言道外语（`@string/app_name`）

### 4.3 简短描述（80 字以内）

> 多语言学习平台，词汇练习、考级模考、拍照翻译、社交互动，一站式外语学习体验。

（共 36 字，符合 80 字以内要求）

### 4.4 详细描述（400 字以内）

> 言道外语是一款专注于多语言学习的教育应用，致力于为用户提供高效、有趣、系统化的外语学习体验。
>
> 核心功能涵盖词汇练习、语法阅读、考级模考、拍照翻译、社交互动等模块。词汇模块支持多语种单词记忆与复习，结合间隔重复算法巩固学习效果；考级模考覆盖主流语言等级考试题型，助力用户高效备考；拍照翻译功能可即时识别并翻译图片中的外文内容，满足出行与学习场景需求；社交互动模块让用户与全球语言学习者交流分享，在真实语境中提升语言能力。
>
> 言道外语尊重并保护用户隐私，不收集位置、通讯录等敏感信息，无第三方广告与统计 SDK，为用户营造纯净、专注的学习环境。无论你是零基础入门还是进阶提升，言道外语都是你外语学习路上的可靠伙伴。

（约 290 字，符合 400 字以内要求）

### 4.5 应用截图

需准备**至少 5 张**应用截图，建议尺寸 1080×1920（竖屏），覆盖核心功能页面：

| 序号 | 截图内容 | 用途说明 |
| :--: | --- | --- |
| 1 | 首页 | 展示应用主界面与功能入口 |
| 2 | 词汇练习 | 展示单词学习与复习流程 |
| 3 | 翻译 | 展示拍照翻译 / 文本翻译功能 |
| 4 | 社交动态 | 展示社区互动与学习分享 |
| 5 | 个人中心 | 展示学习数据与个人主页 |

> **建议**：每张截图可叠加简短功能文案（4-6 字），突出核心卖点。截图需为真实应用界面，禁止过度美化失真。

### 4.6 分类与分级

| 项目 | 内容 |
| --- | --- |
| 应用分类 | 教育 |
| 内容分级 | 适合所有年龄段 |
| 目标受众 | 13 岁以上 |

---

## 5. 上架检查清单

以下为提交应用商店前的逐项检查清单，所有项目需逐一确认并勾选。

### 5.1 签名与构建

- [ ] APK 已使用正式 release 签名（`signingConfigs.release`）
- [ ] 签名方案启用 V2 签名（`v2SigningEnabled=true`），V1 关闭
- [ ] release 构建已开启代码混淆（`minifyEnabled=true`）与资源压缩（`shrinkResources=true`）
- [ ] ProGuard 规则（`proguard-rules.pro`）配置正确，未误删 WebView 相关类
- [ ] APK 已通过 `zipalign` 对齐（构建流程自动完成）

### 5.2 包名与版本

- [ ] 包名正确：`ai.yandao.ailos`（`applicationId` 与 `namespace` 一致）
- [ ] 版本号正确：versionName=`3.2.0`，versionCode=`320`
- [ ] versionCode 相较上一版本（310）单调递增

### 5.3 图标与启动

- [ ] 应用图标已替换为鹦鹉头像（`ic_launcher.xml` + `ic_launcher_round.xml`）
- [ ] 各密度 mipmap 资源（mdpi~xxxhdpi）均已生成
- [ ] 启动页无第三方广告
- [ ] 启动页无加载延迟异常（白屏时间在可接受范围内）

### 5.4 隐私合规

- [ ] 隐私协议弹窗首次启动正常弹出
- [ ] 用户同意前不加载 H5 内容、不发起网络请求
- [ ] 权限调用前弹出应用内权限说明弹窗
- [ ] 所有权限在隐私协议中有对应说明（见第 2 节权限说明表）
- [ ] 未声明位置、通讯录、短信、通话记录等敏感权限
- [ ] 未声明 `REQUEST_INSTALL_PACKAGES`

### 5.5 SDK 合规

- [ ] 无第三方统计 SDK
- [ ] 无第三方广告 SDK
- [ ] 依赖清单（`build.gradle`）经人工复核，无隐藏数据采集组件

### 5.6 网络与安全

- [ ] 网络安全配置仅允许 HTTPS（`cleartextTrafficPermitted=false`）
- [ ] `usesCleartextTraffic=false`
- [ ] 生产环境域名仅 `https://yandao.vip`
- [ ] `BASE_URL` / `API_BASE_URL` 指向生产环境，未残留测试环境地址

### 5.7 数据保护

- [ ] `allowBackup=false`
- [ ] `fullBackupContent=false`
- [ ] `dataExtractionRules` 已排除 root 域（云备份与设备迁移均排除）

### 5.8 兼容性与架构

- [ ] 64 位支持（`compileSdk=34`，默认包含 64 位 ABI）
- [ ] `targetSdkVersion` 符合 Google Play 要求（≥33，当前为 34）
- [ ] `minSdk=26`（Android 8.0），覆盖目标用户群体
- [ ] Android 13+ 通知权限（`POST_NOTIFICATIONS`）运行时申请逻辑正常
- [ ] Android 13+ 图片权限（`READ_MEDIA_IMAGES`）运行时申请逻辑正常
- [ ] 深度链接（App Links）`autoVerify=true` 已配置且可通过验证

### 5.9 商店素材

- [ ] 应用图标（512×512 高清版）已准备
- [ ] 简短描述（80 字内）已撰写
- [ ] 详细描述（400 字内）已撰写
- [ ] 至少 5 张应用截图已准备（首页、词汇练习、翻译、社交动态、个人中心）
- [ ] 应用分类（教育）已确认
- [ ] 内容分级（适合所有年龄段）已确认
- [ ] 目标受众（13 岁以上）已确认

### 5.10 功能与体验

- [ ] 首次启动引导流程正常（隐私协议 → 权限说明 → 功能使用）
- [ ] WebView 在无网络时显示友好提示
- [ ] 下拉刷新功能正常（`swiperefreshlayout`）
- [ ] 竖屏锁定生效（`screenOrientation="portrait"`）
- [ ] 返回键退出逻辑正常（不直接杀进程，二次返回退出提示）
- [ ] 各核心功能（词汇、翻译、社交、个人中心）在 release 包中可正常访问

### 5.11 提交前最终确认

- [ ] release APK 已在真机（至少 2 款不同品牌）完成安装测试
- [ ] release APK 已在 Android 8.0 与 Android 14 各完成一轮冒烟测试
- [ ] APK 文件大小在合理范围内（无异常体积膨胀）
- [ ] 已生成对应版本的发布说明（Changelog）
- [ ] 应用商店后台资质材料（软著、ICP 备案等）齐全且在有效期内

---

## 6. 附录：版本与配置校验记录

本附录记录 v3.2.0 上架文档与实际工程配置的校验结果，确保文档与代码一致。

### 6.1 build.gradle 校验

| 配置项 | 文档值 | 实际值（`build.gradle`） | 一致性 |
| --- | --- | --- | :--: |
| applicationId | `ai.yandao.ailos` | `ai.yandao.ailos` | 一致 |
| namespace | `ai.yandao.ailos` | `ai.yandao.ailos` | 一致 |
| versionCode | 320 | 320 | 一致 |
| versionName | `3.2.0` | `3.2.0` | 一致 |
| minSdk | 26 | 26 | 一致 |
| targetSdk | 34 | 34 | 一致 |
| compileSdk | 34 | 34 | 一致 |

### 6.2 AndroidManifest.xml 权限校验

| 权限 | 文档声明 | 实际声明 | 一致性 |
| --- | :--: | :--: | :--: |
| INTERNET | 是 | 是 | 一致 |
| ACCESS_NETWORK_STATE | 是 | 是 | 一致 |
| CAMERA | 是 | 是 | 一致 |
| RECORD_AUDIO | 是 | 是 | 一致 |
| READ_EXTERNAL_STORAGE（maxSdk=32） | 是 | 是 | 一致 |
| READ_MEDIA_IMAGES | 是 | 是 | 一致 |
| POST_NOTIFICATIONS | 是 | 是 | 一致 |

### 6.3 隐私安全配置校验

| 配置项 | 文档值 | 实际值 | 一致性 |
| --- | :--: | :--: | :--: |
| allowBackup | false | false | 一致 |
| fullBackupContent | false | false | 一致 |
| usesCleartextTraffic | false | false | 一致 |
| networkSecurityConfig | 仅 HTTPS | `cleartextTrafficPermitted=false` | 一致 |
| dataExtractionRules | 排除 root | 排除 root（cloud-backup + device-transfer） | 一致 |

### 6.4 应用图标与名称校验

| 配置项 | 文档值 | 实际值 | 一致性 |
| --- | --- | --- | :--: |
| app_name | 言道外语 | 言道外语（`strings.xml`） | 一致 |
| icon | ic_launcher | `@mipmap/ic_launcher` | 一致 |
| roundIcon | ic_launcher_round | `@mipmap/ic_launcher_round` | 一致 |
| 自适应图标 | 是 | `adaptive-icon`（anydpi-v26） | 一致 |

---

> **文档状态**：已完成 v3.2.0 上架准备清单编制，所有配置项已与工程源码核对一致。
> **下一步**：按第 5 节检查清单逐项执行，全部勾选完成后即可提交应用商店审核。
