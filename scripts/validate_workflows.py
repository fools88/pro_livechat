import yaml
import glob
import sys

ok = True
for f in sorted(glob.glob('.github/workflows/*')):
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            yaml.safe_load(fh)
        print('OK:', f)
    except Exception as e:
        print('ERROR parsing', f, e, file=sys.stderr)
        ok = False

if not ok:
    sys.exit(2)
print('All workflows valid')
