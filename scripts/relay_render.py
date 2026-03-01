#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Render Relay Kit templates into a target project.

Features:
- Profile-based placeholder rendering
- Tool-selective file generation
- Managed block upsert (RELAY:START/END)
- Backup before overwrite/update
- Optional bilingual naming outputs
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TemplateItem:
    src: str
    dest: str
    managed: bool = False
    tools: tuple[str, ...] = ()
    naming: tuple[str, ...] = ("bilingual", "cn", "en")


TEMPLATE_MANIFEST: tuple[TemplateItem, ...] = (
    TemplateItem("AGENTS.md.tmpl", "AGENTS.md", managed=True),
    TemplateItem("GEMINI.md.tmpl", "GEMINI.md", managed=True, tools=("antigravity",)),
    TemplateItem(".cursorrules.tmpl", ".cursorrules", managed=True, tools=("cursor",)),
    TemplateItem(".cursor/rules/00-core.mdc.tmpl", ".cursor/rules/00-core.mdc", managed=True, tools=("cursor",)),
    TemplateItem(".cursor/rules/10-handoff.mdc.tmpl", ".cursor/rules/10-handoff.mdc", managed=True, tools=("cursor",)),
    TemplateItem(
        ".github/copilot-instructions.md.tmpl",
        ".github/copilot-instructions.md",
        managed=True,
        tools=("vscode",),
    ),
    TemplateItem(
        ".github/instructions/handoff.instructions.md.tmpl",
        ".github/instructions/handoff.instructions.md",
        managed=True,
        tools=("vscode",),
    ),
    TemplateItem("progress.md.tmpl", "progress.md", managed=True),
    TemplateItem("task_registry.md.tmpl", "task_registry.md", managed=True),
    TemplateItem("task_plan.md.tmpl", "task_plan.md", managed=True),
    TemplateItem("findings.md.tmpl", "findings.md", managed=True),
    TemplateItem("修改记录_会话备忘.md.tmpl", "修改记录_会话备忘.md", managed=True, naming=("bilingual", "cn")),
    TemplateItem("session_record.md.tmpl", "session_record.md", managed=True, naming=("bilingual", "en")),
    TemplateItem(
        "模型接力开发_固定提示词与命令.txt.tmpl",
        "模型接力开发_固定提示词与命令.txt",
        managed=True,
        naming=("bilingual", "cn"),
    ),
    TemplateItem("relay_prompts.txt.tmpl", "relay_prompts.txt", managed=True, naming=("bilingual", "en")),
    TemplateItem("scripts/preflight.ps1.tmpl", "scripts/preflight.ps1"),
    TemplateItem("scripts/sync_skills.ps1.tmpl", "scripts/sync_skills.ps1"),
    TemplateItem("copy_skills.py.tmpl", "copy_skills.py"),
    TemplateItem("relay.map.json.tmpl", "relay.map.json"),
)


PLACEHOLDER_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_.-]+)\s*}}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render Relay Kit templates")
    parser.add_argument("--project-root", required=True, help="Target project root")
    parser.add_argument("--profile", default="stock-cn", help="Profile name from relay.config.json")
    parser.add_argument("--tools", default="antigravity,cursor,vscode,codex", help="Comma-separated tools list")
    parser.add_argument("--naming", default="bilingual", choices=["bilingual", "cn", "en"], help="Naming strategy")
    parser.add_argument("--force", action="store_true", help="Force managed prepend / overwrite non-managed files")
    parser.add_argument("--report-file", default="", help="Optional path to write JSON report")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_value(context: dict[str, Any], key: str) -> str:
    value: Any = context
    for part in key.split("."):
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return ""
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def render_content(raw: str, context: dict[str, Any]) -> str:
    return PLACEHOLDER_PATTERN.sub(lambda m: resolve_value(context, m.group(1)), raw)


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def backup_file(src: Path, backup_root: Path, project_root: Path, report: dict[str, Any], backed_up: set[str]) -> None:
    rel = str(src.relative_to(project_root)).replace("\\", "/")
    if rel in backed_up:
        return
    dst = backup_root / rel
    ensure_parent(dst)
    shutil.copy2(src, dst)
    report["backed_up"].append(rel)
    backed_up.add(rel)


def wrap_managed_block(content: str, start_marker: str, end_marker: str) -> str:
    return f"{start_marker}\n{content.rstrip()}\n{end_marker}\n"


def upsert_managed(
    path: Path,
    rendered: str,
    start_marker: str,
    end_marker: str,
    force: bool,
    backup_root: Path,
    project_root: Path,
    report: dict[str, Any],
    backed_up: set[str],
) -> str:
    rel = str(path.relative_to(project_root)).replace("\\", "/")
    managed_block = wrap_managed_block(rendered, start_marker, end_marker)

    if not path.exists():
        ensure_parent(path)
        path.write_text(managed_block, encoding="utf-8")
        report["created"].append(rel)
        return "created"

    existing = path.read_text(encoding="utf-8")
    pattern = re.compile(re.escape(start_marker) + r".*?" + re.escape(end_marker), re.DOTALL)

    if pattern.search(existing):
        updated = pattern.sub(lambda _m: managed_block.rstrip(), existing, count=1)
        if updated == existing:
            report["unchanged"].append(rel)
            return "unchanged"
        backup_file(path, backup_root, project_root, report, backed_up)
        path.write_text(updated, encoding="utf-8")
        report["updated"].append(rel)
        return "updated"

    if not force:
        report["skipped"].append(rel)
        return "skipped"

    updated = managed_block + "\n" + existing.lstrip("\n")
    if updated == existing:
        report["unchanged"].append(rel)
        return "unchanged"
    backup_file(path, backup_root, project_root, report, backed_up)
    path.write_text(updated, encoding="utf-8")
    report["updated"].append(rel)
    return "updated"


def write_non_managed(
    path: Path,
    rendered: str,
    force: bool,
    backup_root: Path,
    project_root: Path,
    report: dict[str, Any],
    backed_up: set[str],
) -> str:
    rel = str(path.relative_to(project_root)).replace("\\", "/")
    if not path.exists():
        ensure_parent(path)
        path.write_text(rendered.rstrip() + "\n", encoding="utf-8")
        report["created"].append(rel)
        return "created"

    existing = path.read_text(encoding="utf-8")
    updated = rendered.rstrip() + "\n"
    if existing == updated:
        report["unchanged"].append(rel)
        return "unchanged"
    if not force:
        report["skipped"].append(rel)
        return "skipped"

    backup_file(path, backup_root, project_root, report, backed_up)
    path.write_text(updated, encoding="utf-8")
    report["updated"].append(rel)
    return "updated"


def should_apply_template(item: TemplateItem, selected_tools: set[str], naming: str) -> bool:
    if item.tools and not selected_tools.intersection(item.tools):
        return False
    if naming not in item.naming:
        return False
    return True


def build_context(config: dict[str, Any], profile_name: str, naming: str, selected_tools: set[str]) -> dict[str, Any]:
    defaults = config.get("defaults", {})
    profiles = config.get("profiles", {})
    if profile_name not in profiles:
        raise KeyError(f"Profile not found: {profile_name}")
    profile = profiles[profile_name]

    startup = defaults.get("startupReadOrder", [])
    snapshot = defaults.get("snapshotFields", [])
    session_fields = defaults.get("sessionContextFields", [])

    context: dict[str, Any] = {
        "profile": profile,
        "defaults": defaults,
        "profileName": profile_name,
        "naming": naming,
        "selectedToolsCsv": ",".join(sorted(selected_tools)),
        "selectedToolsDisplay": " / ".join(sorted(selected_tools)),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "startupReadOrderArrow": " -> ".join(startup),
        "startupReadOrderBullets": "\n".join(f"{idx + 1}. `{name}`" for idx, name in enumerate(startup)),
        "snapshotFieldsCn": "、".join(snapshot),
        "sessionContextFieldsCn": "、".join(session_fields),
    }
    return context


def copy_global_skills(
    project_root: Path,
    kit_root: Path,
    force: bool,
    backup_root: Path,
    report: dict[str, Any],
    backed_up: set[str],
) -> None:
    src_root = kit_root / "global-skills"
    if not src_root.exists():
        report["notes"].append("global-skills source not found, skipped")
        return

    dst_root = project_root / ".relay" / "skills"
    dst_root.mkdir(parents=True, exist_ok=True)

    for skill_dir in sorted([p for p in src_root.iterdir() if p.is_dir()]):
        rel = str((dst_root / skill_dir.name).relative_to(project_root)).replace("\\", "/")
        dst = dst_root / skill_dir.name
        if dst.exists():
            if not force:
                report["skipped"].append(rel)
                continue
            for f in dst.rglob("*"):
                if f.is_file():
                    backup_file(f, backup_root, project_root, report, backed_up)
            shutil.rmtree(dst)

        shutil.copytree(skill_dir, dst)
        report["created"].append(rel)


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    config_path = project_root / "relay.config.json"
    kit_root = project_root / "starter" / "relay-kit-v1"
    template_root = kit_root / "templates"

    if not project_root.exists():
        print(f"[FAIL] project root not found: {project_root}")
        return 1
    if not config_path.exists():
        print(f"[FAIL] config file not found: {config_path}")
        return 1
    if not template_root.exists():
        print(f"[FAIL] template root not found: {template_root}")
        return 1

    config = load_json(config_path)
    selected_tools = {tool.strip().lower() for tool in args.tools.split(",") if tool.strip()}
    context = build_context(config, args.profile, args.naming, selected_tools)

    managed = config.get("managedBlock", {})
    start_marker = managed.get("start", "<!-- RELAY:START -->")
    end_marker = managed.get("end", "<!-- RELAY:END -->")

    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = project_root / "_relay_backups" / now
    report: dict[str, Any] = {
        "timestamp": now,
        "projectRoot": str(project_root),
        "profile": args.profile,
        "tools": sorted(selected_tools),
        "naming": args.naming,
        "force": bool(args.force),
        "created": [],
        "updated": [],
        "skipped": [],
        "unchanged": [],
        "backed_up": [],
        "notes": [],
    }
    backed_up: set[str] = set()

    for item in TEMPLATE_MANIFEST:
        if not should_apply_template(item, selected_tools, args.naming):
            continue

        src = template_root / item.src
        dst = project_root / item.dest
        if not src.exists():
            report["notes"].append(f"template missing: {item.src}")
            continue

        raw = src.read_text(encoding="utf-8")
        rendered = render_content(raw, context)

        if item.managed:
            upsert_managed(
                path=dst,
                rendered=rendered,
                start_marker=start_marker,
                end_marker=end_marker,
                force=args.force,
                backup_root=backup_root,
                project_root=project_root,
                report=report,
                backed_up=backed_up,
            )
        else:
            write_non_managed(
                path=dst,
                rendered=rendered,
                force=args.force,
                backup_root=backup_root,
                project_root=project_root,
                report=report,
                backed_up=backed_up,
            )

    copy_global_skills(
        project_root=project_root,
        kit_root=kit_root,
        force=args.force,
        backup_root=backup_root,
        report=report,
        backed_up=backed_up,
    )

    if not report["backed_up"] and backup_root.exists():
        shutil.rmtree(backup_root)

    if args.report_file:
        report_file = Path(args.report_file).resolve()
        ensure_parent(report_file)
        report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Relay render completed.")
    print(f"  created:   {len(report['created'])}")
    print(f"  updated:   {len(report['updated'])}")
    print(f"  skipped:   {len(report['skipped'])}")
    print(f"  unchanged: {len(report['unchanged'])}")
    print(f"  backups:   {len(report['backed_up'])}")
    if report["backed_up"]:
        print(f"  backup_dir: {backup_root}")
    if report["notes"]:
        print("  notes:")
        for note in report["notes"]:
            print(f"    - {note}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n[INTERRUPTED]")
        raise SystemExit(130)
