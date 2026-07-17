#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AILOS 自动化合规检测脚本 v1.0.0
软件架构蓝图 v2.0.0 强制执行

检测范围：
- 一级违规：直连模型API、硬编码密钥、跨库写入、跳层调用
- 二级违规：硬编码Prompt、跳过缓存、模块越界
- 三级违规：代码不规范、命名不规范

使用方式：
  python compliance_check.py [--path <项目路径>] [--level <1|2|3|all>]
"""

import os
import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple


class ComplianceChecker:
    """AILOS 合规检测器"""

    # 一级违规检测规则（零容忍，立即拦截）
    LEVEL_1_RULES = [
        {
            "id": "L1-001",
            "name": "直连模型API",
            "pattern": r'(https?://api\.(openai|anthropic|deepseek|hunyuan)|sk-[a-zA-Z0-9]{20,})',
            "description": "代码中检测到直连模型API地址或密钥",
            "severity": "critical",
        },
        {
            "id": "L1-002",
            "name": "跨库写入",
            "pattern": r'(INSERT\s+INTO\s+(user_db|learning_db|companion_db|knowledge_db|social_db|marketing_db|system_db))',
            "description": "检测到跨库直接写入操作",
            "severity": "critical",
        },
        {
            "id": "L1-003",
            "name": "跳层调用",
            "pattern": r'',  # 需要更复杂的AST分析
            "description": "检测到跨层直接调用",
            "severity": "critical",
            "disabled": True,  # 需要AST分析，暂用人工审查
        },
        {
            "id": "L1-004",
            "name": "硬编码API密钥",
            "pattern": r'(api_key|apiKey|secret_key|secretKey|access_key|accessKey)\s*[:=]\s*["\'](?!\$\{)(?!CHANGE_ME)[a-zA-Z0-9_-]{20,}["\']',
            "description": "代码中硬编码了API密钥",
            "severity": "critical",
        },
        {
            "id": "L1-005",
            "name": "硬编码模型接口地址",
            "pattern": r'(https?://[a-zA-Z0-9.-]+/(v1/chat|v1/completions|v1/embeddings))',
            "description": "代码中硬编码了模型接口地址",
            "severity": "critical",
        },
        {
            "id": "L1-006",
            "name": "直接物理删除核心资产",
            "pattern": r'(DELETE\s+FROM\s+(users|user_profiles|learner_profiles|companion_memories|knowledge_nodes|public_questions)\s+WHERE)',
            "description": "检测到对核心资产表的物理删除操作",
            "severity": "critical",
        },
    ]

    # 二级违规检测规则
    LEVEL_2_RULES = [
        {
            "id": "L2-001",
            "name": "硬编码完整Prompt",
            "pattern": r'(你是一个|You are a|system_prompt|systemPrompt)\s*[:=]\s*["\'](.{50,})["\']',
            "description": "代码中硬编码了超过50字符的指令性文本",
            "severity": "warning",
        },
        {
            "id": "L2-002",
            "name": "跳过缓存调用",
            "pattern": r'(skipCache|skip_cache|bypassCache|bypass_cache|forceRefresh|force_refresh)\s*[:=]\s*(true|1)',
            "description": "检测到强制跳过缓存的代码",
            "severity": "warning",
        },
        {
            "id": "L2-003",
            "name": "模块越界",
            "pattern": r'',  # 需要AST分析
            "description": "检测到模块越界调用",
            "severity": "warning",
            "disabled": True,
        },
    ]

    # 三级违规检测规则
    LEVEL_3_RULES = [
        {
            "id": "L3-001",
            "name": "文件命名不规范",
            "pattern": r'',  # 通过文件名检查
            "description": "文件命名不符合kebab-case规范",
            "severity": "info",
        },
        {
            "id": "L3-002",
            "name": "缺少文件头注释",
            "pattern": r'',
            "description": "源文件缺少必要的文件头注释",
            "severity": "info",
        },
    ]

    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.violations: List[Dict] = []
        self.exclude_dirs = {'node_modules', 'dist', '.git', 'backups', '__pycache__', '.expo'}

    def scan_file(self, filepath: Path) -> List[Dict]:
        """扫描单个文件"""
        violations = []
        try:
            content = filepath.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            return violations

        rel_path = str(filepath.relative_to(self.project_path))

        # 检查一级违规
        for rule in self.LEVEL_1_RULES:
            if rule.get('disabled'):
                continue
            matches = re.finditer(rule['pattern'], content, re.IGNORECASE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                violations.append({
                    "level": 1,
                    "rule_id": rule['id'],
                    "rule_name": rule['name'],
                    "file": rel_path,
                    "line": line_num,
                    "match": match.group()[:100],
                    "severity": rule['severity'],
                    "description": rule['description'],
                })

        # 检查二级违规
        for rule in self.LEVEL_2_RULES:
            if rule.get('disabled'):
                continue
            matches = re.finditer(rule['pattern'], content, re.IGNORECASE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                violations.append({
                    "level": 2,
                    "rule_id": rule['id'],
                    "rule_name": rule['name'],
                    "file": rel_path,
                    "line": line_num,
                    "match": match.group()[:100],
                    "severity": rule['severity'],
                    "description": rule['description'],
                })

        return violations

    def scan_all(self) -> List[Dict]:
        """扫描所有文件"""
        for root, dirs, files in os.walk(self.project_path):
            dirs[:] = [d for d in dirs if d not in self.exclude_dirs]
            for file in files:
                if file.endswith(('.ts', '.js', '.tsx', '.jsx', '.py', '.sql', '.json', '.yaml', '.yml')):
                    filepath = Path(root) / file
                    self.violations.extend(self.scan_file(filepath))
        return self.violations

    def report(self, min_level: int = 1) -> Tuple[bool, str]:
        """生成合规报告"""
        violations = self.scan_all()
        level_1 = [v for v in violations if v['level'] == 1]
        level_2 = [v for v in violations if v['level'] == 2]
        level_3 = [v for v in violations if v['level'] == 3]

        report_lines = [
            "=" * 60,
            "AILOS 自动化合规检测报告",
            f"扫描路径: {self.project_path}",
            f"扫描时间: {__import__('datetime').datetime.now().isoformat()}",
            "=" * 60,
            "",
            f"一级违规（严重）: {len(level_1)} 项",
            f"二级违规（警告）: {len(level_2)} 项",
            f"三级违规（提示）: {len(level_3)} 项",
            "",
        ]

        if level_1:
            report_lines.append("!!! 一级违规详情（零容忍，立即回滚）!!!")
            report_lines.append("-" * 60)
            for v in level_1:
                report_lines.append(f"  [{v['rule_id']}] {v['rule_name']}")
                report_lines.append(f"  文件: {v['file']}:{v['line']}")
                report_lines.append(f"  匹配: {v['match']}")
                report_lines.append(f"  说明: {v['description']}")
                report_lines.append("")
            report_lines.append("!!! 存在一级违规，代码提交必须拦截 !!!")
            report_lines.append("")

        if level_2:
            report_lines.append("二级违规详情（72小时内整改）")
            report_lines.append("-" * 60)
            for v in level_2:
                report_lines.append(f"  [{v['rule_id']}] {v['rule_name']} - {v['file']}:{v['line']}")
            report_lines.append("")

        if level_3:
            report_lines.append("三级违规详情（合并前修复）")
            report_lines.append("-" * 60)
            for v in level_3:
                report_lines.append(f"  [{v['rule_id']}] {v['rule_name']} - {v['file']}:{v['line']}")
            report_lines.append("")

        report = "\n".join(report_lines)
        passed = len(level_1) == 0
        return passed, report


def main():
    import argparse
    parser = argparse.ArgumentParser(description='AILOS 合规检测')
    parser.add_argument('--path', default=r'E:\AILOS_Project', help='项目路径')
    parser.add_argument('--level', default='all', choices=['1', '2', '3', 'all'], help='检测级别')
    parser.add_argument('--output', default=None, help='输出报告路径')
    args = parser.parse_args()

    checker = ComplianceChecker(args.path)
    passed, report = checker.report()

    print(report)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)

    if not passed:
        print("\n[FAIL] 合规检测未通过：存在一级违规项！")
        sys.exit(1)
    else:
        print("\n[PASS] 合规检测通过！")
        sys.exit(0)


if __name__ == '__main__':
    main()
