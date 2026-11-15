"""Make a review loop and pose board from npm run smoke -- rook-rig screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'tools/shots'
OUT = ROOT / 'art/preview'
OUT.mkdir(parents=True, exist_ok=True)
paths = sorted(SHOTS.glob('rook-rig-pose-*.png'), key=lambda p: int(p.stem.rsplit('-', 1)[1]))
if len(paths) < 26:
    raise SystemExit('Run npm.cmd run smoke -- rook-rig first (26 poses required).')
frames = [Image.open(p).convert('RGB') for p in paths[-8:]]
frames[0].save(OUT / 'rook-run.gif', save_all=True, append_images=frames[1:], duration=68, loop=0)
board = Image.new('RGB', (880, 640), '#222939')
draw = ImageDraw.Draw(board)
labels = ['CONTACT', 'COMPRESSION', 'PASSING', 'LIFT', 'FLIGHT', 'RECOVERY', 'PASSING', 'REACH']
for i, (frame, label) in enumerate(zip(frames, labels)):
    x, y = i % 4 * 220, i // 4 * 220
    board.paste(frame, (x, y + 20))
    draw.text((x + 8, y + 4), label, fill='#9fe8ff')
for i, (index, label) in enumerate([(1, 'AIM RIGHT'), (2, 'AIM LEFT'), (13, 'CROUCH'), (16, 'DEATH')]):
    x, y = i * 220, 440
    board.paste(Image.open(SHOTS / f'rook-rig-pose-{index}.png'), (x, y))
    draw.text((x + 8, y + 4), label, fill='#9fe8ff')
board.save(OUT / 'rook-review.png')
print(OUT / 'rook-run.gif')
print(OUT / 'rook-review.png')
