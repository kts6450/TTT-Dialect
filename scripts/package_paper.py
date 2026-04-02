"""
논문 제출용 결과 패키지 생성.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


REQUIRED_FILES = [
    "baseline_per_speaker.csv",
    "baseline_summary.json",
    "ttt_variants_per_speaker.csv",
    "ttt_variants_summary.json",
    "stat_tests.json",
    "paper_main_table.csv",
    "ablation.csv",
    "ablation_summary.csv",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="package paper outputs")
    p.add_argument("--result_dir", default="./evaluation/results")
    p.add_argument("--out_dir", default="./paper_package")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    result_dir = Path(args.result_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    copied = []
    for name in REQUIRED_FILES:
        src = result_dir / name
        if src.exists():
            dst = out_dir / name
            shutil.copy2(src, dst)
            copied.append(name)

    paper_dir = Path("./paper")
    if paper_dir.exists():
        for name in ["claims_and_hypotheses.md", "dataset_protocol.md", "manuscript_template.md"]:
            src = paper_dir / name
            if src.exists():
                shutil.copy2(src, out_dir / name)
                copied.append(name)

    print("패키징 완료 파일:")
    for name in copied:
        print("-", name)


if __name__ == "__main__":
    main()
