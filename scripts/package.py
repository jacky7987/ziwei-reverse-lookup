"""Package only public build output; never include source, credentials or test data."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
with ZipFile(root / "ziwei-web.zip", "w", ZIP_DEFLATED) as archive:
    for file in sorted((root / "dist").iterdir()):
        if file.is_file():
            archive.write(file, file.name)
print(f"可直接上傳的部署包：{root / 'ziwei-web.zip'}")
