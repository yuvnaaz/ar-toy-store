"""Copy an explicit public-file allowlist; never publish repo metadata or secrets."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parent.parent
out = root / 'portfolio-site'
public = out / 'dist'
public.mkdir(parents=True, exist_ok=True)
files = ['index.html', 'style.css', 'addMarkers.js', 'markerHandler.js', 'addButtons.js', 'preview.js', 'ar.html', 'ar-preview.js', 'firebase-config.js', 'cloud.js']
for name in files:
    shutil.copy2(root / name, public / name)
shutil.copytree(root / 'assets', public / 'assets', dirs_exist_ok=True)
manifest = root / '.openai/hosting.json'
if manifest.exists():
    (out / '.openai').mkdir(exist_ok=True)
    shutil.copy2(manifest, out / '.openai/hosting.json')
for name in ['README.md', 'firebase.json', 'firestore.rules']:
    shutil.copy2(root / name, out / name)
print('Prepared portfolio-site/dist with public assets only.')
