# AILOS 4套打包平台分步操作文档

## 一、Codemagic.io 操作步骤

### 1. GitHub仓库授权
1. 访问 https://codemagic.io → 登录
2. 点击「Add application」→ 选择「GitHub」
3. 授权访问 wzmpa18/AILOS 仓库
4. 选择仓库，项目类型选「Native Android」

### 2. 密钥base64配置
```bash
# 本地将keystore转为base64
base64 -i ailos-release.keystore | tr -d '\n'
```
1. 进入项目「Environment variables」
2. 添加变量组 `ailos_keystore`：
   - `CM_KEYSTORE_BASE64`: 粘贴base64字符串
   - `CM_KEYSTORE_PASSWORD`: keystore密码
   - `CM_KEY_ALIAS`: key别名
   - `CM_KEY_PASSWORD`: key密码
3. 添加变量组 `ailos_notify`：
   - `WECOM_WEBHOOK`: 企业微信机器人webhook地址

### 3. 触发构建
1. 进入「Build」→ 选择 `main` 分支
2. 点击「Start new build」
3. 等待预构建校验（10项）+ APK编译
4. 构建完成后在「Artifacts」下载APK

### 4. 制品下载
- APK路径: `android-shell/app/build/outputs/apk/release/AILOS_v1.0.0_Release.apk`
- Mapping: `android-shell/app/build/outputs/apk/release/mapping_v1.0.0.txt`

---

## 二、腾讯CODING DevOps 操作步骤

### 1. 项目创建
1. 访问 https://coding.net → 注册/登录
2. 创建团队→创建项目→选择「DevOps项目」
3. 项目名: `AILOS`

### 2. 代码仓库导入
1. 进入「代码仓库」→「导入外部仓库」
2. 选择GitHub→授权→选择 `wzmpa18/AILOS`
3. 等待导入完成

### 3. 保密环境变量添加
1. 进入「项目设置」→「开发者选项」→「凭证管理」
2. 添加4个凭证：
   - `ailos-keystore-path`: keystore文件路径（上传文件）
   - `ailos-keystore-password`: keystore密码
   - `ailos-key-alias`: key别名
   - `ailos-key-password`: key密码

### 4. 制品库配置
1. 进入「制品管理」→「创建制品库」
2. 制品库名: `AILOS-APK`
3. 构建完成后自动存入

### 5. 通知机器人配置
1. 进入「项目设置」→「通知」→「企业微信」
2. 添加webhook地址
3. 勾选「构建成功/失败」通知

### 6. 构建流水线
1. 进入「持续集成」→「创建流水线」
2. 选择「使用Jenkinsfile」→ 导入 `CODING_JENKINSFILE`
3. 触发方式: 推送到main/dev自动触发
4. 构建完成后在「制品库」下载APK

---

## 三、APICloud 云端打包操作步骤

### 1. 后台导入项目
1. 访问 https://www.apicloud.com → 注册/登录
2. 创建应用→输入应用名 `AILOS言道学外语`
3. 上传 `APICLOUD_CONFIG.xml`

### 2. 上传源码
1. 将 `android-shell/` 目录打包为zip
2. 在APICloud后台上传源码包

### 3. 配置证书
1. 进入「证书管理」→「上传证书」
2. 上传 `ailos-release.keystore` 文件
3. 填写: keystore密码、key别名、key密码

### 4. 一键打包
1. 进入「云编译」→选择「Android」
2. 编译类型: Release
3. 点击「云编译」→等待2-5分钟
4. 下载生成的APK

---

## 四、Docker+Jenkins 自建打包操作步骤

### 1. 一键部署环境
```bash
# SSH到服务器
ssh root@82.156.228.87

# 创建打包目录
mkdir -p /opt/ailos-build && cd /opt/ailos-build

# 上传docker-compose.yml
# 启动服务
docker-compose -f DOCKER_JENKINS_DEPLOY.yml up -d

# 等待Jenkins启动
# 访问 http://82.156.228.87:8080 获取初始密码
docker exec ailos-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 2. Jenkins配置
1. 访问 http://82.156.228.87:8080
2. 安装插件: Git Plugin + Android Emulator Plugin + Pipeline
3. 添加凭证: ailos-keystore-path/password/alias/key-password
4. 创建Pipeline任务: 导入 `JENKINSPIPELINE`

### 3. 配置Webhook自动触发
1. GitHub仓库→Settings→Webhooks
2. Payload URL: `http://82.156.228.87:8080/github-webhook/`
3. Content type: `application/json`
4. 触发事件: Push

### 4. APK下载
- 构建完成后APK自动同步到: `http://82.156.228.87:8081/download/`
- Release: `AILOS_言道学外语_v1.0.0_Release.apk`
- Debug: `AILOS_言道学外语_v1.0.0_Debug.apk`
- 私有化存储，数据不外流

### 5. 构建失败排查
```bash
# 查看Jenkins日志
docker logs ailos-jenkins --tail 100

# 查看Android Builder日志
docker logs ailos-android-builder --tail 100

# 检查APK输出目录
ls -la /opt/ailos-build/apk_output/
```
