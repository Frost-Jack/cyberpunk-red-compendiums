import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("--tag", help="GitHub release tag")
    args = parser.parse_args()

    manifest = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
    if args.tag:
        manifest["version"] = args.tag.removeprefix("v")
        manifest["download"] = f"{manifest['url']}/releases/download/{args.tag}/module.zip"
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"

    pack = ROOT / manifest["packs"][0]["path"]
    current = pack / "CURRENT"
    segments = sorted(pack.glob("*.ldb"))
    if not segments:
        raise ValueError(f"No compacted LevelDB tables in {pack}")
    files = [
        ROOT / "LICENSE",
        ROOT / "README.md",
        current,
        pack / current.read_text(encoding="ascii").strip(),
        *segments,
        *(ROOT / script for script in manifest["esmodules"]),
        *(ROOT / language["path"] for language in manifest["languages"]),
    ]
    items = json.loads((ROOT / "src/everyday-items.json").read_text(encoding="utf-8"))
    files.extend(ROOT / f"assets/everyday-items/{item['slug']}.svg" for item in items)
    missing = [str(file) for file in files if not file.is_file()]
    if missing:
        raise FileNotFoundError(", ".join(missing))

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "module.json").write_bytes(manifest_json.encode("utf-8"))
    with ZipFile(args.output / "module.zip", "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr("module.json", manifest_json)
        for file in files:
            archive.write(file, file.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
