# AILOS v1.0 Beta APK云端打包全方案

## 基线信息
- **代码基线**: f13eddb (GitHub main)
- **壳工程路径**: android-shell/ (27文件)
- **版本号**: v1.0.0-beta
- **包名**: ai.yandao.ailos

---

## 首选方案：Codemagic（复用现有配置，5步出包）

### 操作步骤
1. **登录关联仓库**：打开codemagic.io→GitHub授权→选择AILOS仓库→构建类型选「Native Android」
2. **确认构建配置**：系统自动读取`android-shell/codemagic.yaml`，构建命令`./gradlew assembleRelease`，无需修改
3. **签名配置**（核心必做）：项目设置→Signing板块→上传.keystore文件→配置3个参数：
   - 密钥库密码（keystore password）
   - 密钥别名（key alias）
   - 密钥密码（key password）
4. **触发构建**：选择main分支→点击「Start new build」→等待3~8分钟
5. **下载APK**：构建成功→Artifacts→下载`AILOS_v1.0.0_Release.apk`

### 优势
- 零额外配置，复用现有codemagic.yaml
- 10项预构建校验自动执行
- V2+V3签名+zipalign自动处理
- 和TRAE原有打包方式完全对齐

---

## 备选方案1：GitHub Actions（完全免费，仓库原生）

### 操作步骤
1. **配置Secrets**：GitHub仓库→Settings→Secrets and variables→Actions→添加4个Secret：
   - `AILOS_KEYSTORE_BASE64`：keystore的base64编码（`base64 -i ailos-release.keystore | tr -d '\n'`）
   - `AILOS_KEYSTORE_PASSWORD`：keystore密码
   - `AILOS_KEY_ALIAS`：key别名
   - `AILOS_KEY_PASSWORD`：key密码
2. **确认workflow文件**：仓库已有`.github/workflows/build-apk.yml`，提交代码自动触发
3. **触发构建**：推送到main分支自动构建Release，推送到dev分支自动构建Debug
4. **下载APK**：Actions页面→对应运行→Artifacts→下载APK

### 优势
- 完全免费，公开仓库无限制
- Git版本强绑定，每个提交对应一个包
- 无需额外平台账号

---

## 备选方案2：蒲公英云构建（国内快，自带分发）

### 操作步骤
1. 注册蒲公英账号→「应用管理-云构建」
2. 授权GitHub仓库→选择AILOS项目→选择构建分支
3. 上传签名密钥→配置构建参数
4. 触发云端构建→自动生成测试下载页→扫码安装

### 优势
- 国内访问快，自带安装统计/崩溃收集/测试反馈
- 构建完成直接生成测试下载页，可分享给用户

---

## 备选方案3：微软App Center（大厂稳定，多端扩展）

### 操作步骤
1. 登录App Center→创建安卓应用
2. 关联GitHub仓库→配置构建分支+签名信息
3. 触发构建→下载APK→可配置自动分发

### 优势
- 大厂稳定，支持崩溃上报/用户行为统计/分阶段分发
- 适合后续扩展iOS端

---

## 打包完成后强制验收标准

| # | 校验项 | 通过标准 |
|---|--------|----------|
| 1 | 安装校验 | APK可直接安装，无"解析包错误/签名不一致" |
| 2 | 签名校验 | Release正式签名，签名指纹与密钥一致 |
| 3 | 版本校验 | 应用内版本v1.0.0-beta，对应基线f13eddb |
| 4 | 内容校验 | 无测试数据/占位文案/调试入口，与线上H5一致 |
| 5 | 基础功能 | 启动无白屏，可跳转登录页，页面加载正常 |

## 下一步
打包验收通过后→执行《SMOKE_TEST_CASES.md》24项真机冒烟测试→入账簿第62章→正式开放用户测试。
