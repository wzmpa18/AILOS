# AILOS v1.0 Beta 统一预构建检查清单（4套打包平台通用）

## 构建前强制校验（10项，一项不通过终止打包）

| # | 检查项 | 校验方式 | 通过标准 |
|---|--------|----------|----------|
| 1 | Git基线 | `git rev-parse --short HEAD` | SHA = f13eddb |
| 2 | 后端健康 | `curl https://yandao.vip/xuewaiyu/api/health` | status=healthy |
| 3 | 会员套餐 | `curl .../api/membership/plans` | ≥3个套餐 |
| 4 | HTTPS可访问 | `curl -sk https://yandao.vip/xuewaiyu/index.html` | HTTP 200 |
| 5 | 壳工程完整性 | 检查build.gradle+MainActivity.java | 文件存在 |
| 6 | 签名环境变量 | 检查keystore+密码变量 | 全部非空 |
| 7 | 无密钥泄露 | grep代码中的keystore/password | 无明文 |
| 8 | 混淆开启 | grep minifyEnabled true | 已开启 |
| 9 | 版本号 | grep versionName "1.0.0" | 1.0.0 |
| 10 | 包名 | grep applicationId | ai.yandao.ailos |

## 业务模块完整性（打包不得删减）

| 模块 | 确认项 |
|------|--------|
| 用户登录注册 | /api/auth/password + /api/auth/register |
| 会员套餐 | /api/membership/plans (3档: free/basic/premium) |
| AI口语练习 | /api/ai/chat + /api/ai/quota |
| 发音评测 | /api/ai/* 评测接口 |
| 支付交互 | /api/membership/order + /payment/callback |
| 代付分享 | /api/membership/proxy/create + /proxy/pay |
| 社交功能 | /api/v1/social/* |
| 翻译功能 | /xuewaiyu/translate.html + scan/conversation子页面 |
| 管理后台 | /api/admin/* (requireAdmin) |
| 权益拦截 | fe-rights.js + requireRight中间件 |

## 真机冒烟测试配套

每套打包方案产出的APK必须通过以下冒烟测试：

### 一级冒烟（6项必过）
1. 安装启动：无解析错误，冷启动≤2秒
2. 登录：手机号+密码登录成功
3. 6大页面：首页/学习/翻译/社交/会员/个人中心 加载正常
4. 拍照翻译：可调用摄像头
5. 会员购买：可调起支付流程
6. 返回键：回退网页历史，二次确认退出

### 数据干净性（5项必过）
- [ ] 无"功能开发中/Coming Soon"文案
- [ ] 无测试账号/示例数据
- [ ] 无调试按钮/隐藏开关
- [ ] 控制台无console.log输出
- [ ] 空状态有友好提示

## 构建失败排查步骤

1. **基线校验失败** → 检查Git分支是否main，后端是否运行
2. **签名失败** → 检查keystore文件完整性+密码正确性
3. **Gradle编译失败** → 检查Android SDK版本+网络连接（国内用镜像源）
4. **APK安装失败** → 检查签名方案(v1+v2+v3)+zipalign对齐
5. **页面白屏** → 检查HTTPS域名可访问性+WebView配置
