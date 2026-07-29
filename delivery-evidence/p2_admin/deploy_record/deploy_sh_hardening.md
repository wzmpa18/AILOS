# deploy.sh 流程硬化说明（落实治理指令 3.2 / 3.6）

## 闸门1 迁移自检（commit c2dd449）
`npx prisma migrate deploy` 后执行 `prisma migrate status`；输出含 `not yet been applied` 则判定部署失败并触发回滚。杜绝 schema 未跟上代码被 GATE 放行。

## 闸门2 账簿版本校验（commit 87f0092）
部署捕获 HEAD commit，执行 `git diff-tree --no-commit-id --name-only -r <HEAD> | grep AILOS_MASTER_LEDGER.md`；若 HEAD 提交未修改总账文件，判定代码上线文档未更，中断部署并回滚。落实 3.1 代码-文档同提交。

## 闸门3 副本 MD5 校验（commit 87f0092）
部署收尾比对仓库 `AILOS_MASTER_LEDGER.md` 与 `/www/AILOS_MASTER_LEDGER.md` 的 MD5；不一致则自动 cp 同步并重算；仍不一致判部署未完成触发回滚。落实 3.6 服务器副本同步强制校验。

## 提交纪律（3.1）
代码-文档同 commit；commit 格式 `[阶段-模块][类型] 内容说明 + 账簿更新章节`。
