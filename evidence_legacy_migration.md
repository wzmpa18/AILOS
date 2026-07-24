# Legacy Migration — 开发工作区校验与锁定报告
**日期**: 2026-07-19 | **状态**: 已完成

## 一、服务器线上版本校验（只读）
| 服务器 IP | 82.156.228.87 |
| 操作系统 | OpenCloudOS 9.4 |
| 在线地址 | https://yandao.vip/xuewaiyu/home |

### PM2 运行进程
| 进程名 | 版本 | 脚本路径 | 状态 |
|--------|------|---------|------|
| xuewaiyu-backend | 1.0.0 | /www/xuewaiyu-backend/server.js | online (3D) |
| yandao-backend | 1.0.0 | /www/yandao-app/backend-v2/server.js | online (6D) |

## 二、版本一致性比对
### E:\TRAE SOLO ↔ 服务器 xuewaiyu-backend
| 维度 | 本地 | 服务器 | 匹配 |
|------|------|--------|------|
| 项目名 | xuewaiyu-app | xuewaiyu-backend | OK |
| 版本 | 1.0.0 | 1.0.0 | OK |
| 运行时 | Express+Prisma+Redis | Express+Node 22.23 | OK |
| 入口 | src/server/index.js | server.js | OK |
**结论: 完全匹配**

### E:\xuewaiyu ↔ 服务器 yandao-backend
| 维度 | 本地 | 服务器 | 匹配 |
|------|------|--------|------|
| 项目名 | yandao-app | yandao-backend | OK |
| 版本 | 1.0.0 | 1.0.0 | OK |
| 运行时 | Express+better-sqlite3 | Express+Node 22.23 | OK |
**结论: 完全匹配**

## 三、Excluded Workspace（永久排除）
1. D:\最新言道学习APP\youdao-main (1)\youdao-main\ — 旧版 Capacitor 项目
2. D:\GendouApp\ — 旧版基础结构
3. E:\yandaoAPP\ (4.7MB) — Vite 前端原型
4. E:\最新言道APP2026-7-16\ (0.6MB) — 文档目录
5. E:\新言道外语\ (1037MB) — TRAE IDE 安装
6. C:\Users\ZhuanZ\xuewaiyu-patch\ (空) — 空目录

## 四、Single Workspace Lock
**唯一开发根目录**: `E:\TRAE SOLO`
| 项目名 | xuewaiyu-app v1.0.0 |
| 大小 | 1257.8 MB |
| 锁定状态 | **Locked** |
| 线上对应 | PM2 xuewaiyu-backend (id 9) |