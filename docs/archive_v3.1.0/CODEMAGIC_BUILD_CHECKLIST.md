# AILOS v1.0 Beta Codemagic构建前检查清单

## 构建基线
- **Git Commit**: f9b5a63
- **分支**: main
- **仓库**: github.com/wzmpa18/AILOS
- **壳工程路径**: android-shell/

## 构建配置复核（10项必查）

| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | 构建类型 | ✓ | release包，minifyEnabled=true, shrinkResources=true |
| 2 | 签名方案 | ✓ | v1+v2+v3全启用，环境变量注入 |
| 3 | 版本号 | ✓ | versionName=1.0.0, versionCode=1 |
| 4 | 包名 | ✓ | ai.yandao.ailos（无debug/test后缀） |
| 5 | 域名配置 | ✓ | BASE_URL=https://yandao.vip/xuewaiyu/ (buildConfig) |
| 6 | 混淆规则 | ✓ | proguard-rules.pro配置，WebView保留+日志移除 |
| 7 | 最低版本 | ✓ | minSdk=26 (Android 8.0) |
| 8 | 目标版本 | ✓ | targetSdk=34 |
| 9 | 无密钥入库 | ✓ | .gitignore排除*.keystore/*.jks |
| 10 | Codemagic配置 | ✓ | codemagic.yaml: assembleRelease + apksigner verify |

## 构建命令
```bash
./gradlew assembleRelease
```

## 产物
- `app/build/outputs/apk/release/app-release.apk`
- `app/build/outputs/mapping/release/mapping.txt`

## 产物命名规范
`AILOS_v1.0.0-beta_build1.apk`

## Codemagic环境变量（需在控制台配置）
- `CM_KEYSTORE_PATH`: keystore文件路径
- `CM_KEYSTORE_PASSWORD`: keystore密码
- `CM_KEY_ALIAS`: key别名
- `CM_KEY_PASSWORD`: key密码

## 构建后验证
1. apksigner verify --verbose 验证签名
2. aapt dump badging 验证包名/版本
3. 真机安装测试

## 备注
Codemagic构建需用户在codemagic.io控制台手动操作：
1. 关联GitHub仓库wzmpa18/AILOS
2. 配置环境变量（keystore + 密码）
3. 触发构建
4. 下载APK产物
