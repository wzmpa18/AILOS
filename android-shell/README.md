# AILOS Android Shell

## 概述
AILOS v1.0 Beta 安卓WebView壳工程，实现「壳业完全分离、业务100%服务端可控」。

## 架构
- 壳工程仅做：容器、适配、原生能力桥接、基础配置
- 所有业务页面通过 `https://yandao.vip/xuewaiyu/` 线上加载
- 运营修改、功能迭代、内容调整无需发版

## 技术规格
- minSdk: 26 (Android 8.0)
- targetSdk: 34
- 签名: v1+v2+v3
- 混淆: 开启（release）
- 版本: 1.0.0 (对应Stage 10基线9b2cef8)

## 10项兜底能力
1. WebViewClient + WebChromeClient全回调处理
2. 摄像头权限使用时申请（非启动时）
3. 硬件加速 + 低版本兼容降级
4. JS接口仅暴露必要方法（AilosJsBridge）
5. 支付/分享回调Intent正确处理
6. Cookie + LocalStorage持久化
7. 崩溃自动恢复（不闪退）
8. 加载超时兜底（10秒）
9. 自定义错误页（非系统白屏）
10. 内存优化（退出时释放WebView）

## 构建
```bash
./gradlew assembleRelease
```

## Codemagic
- 配置文件: codemagic.yaml
- 签名通过环境变量注入（严禁入库）
- 构建号自动递增
