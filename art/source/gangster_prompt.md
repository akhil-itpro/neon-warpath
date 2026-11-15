# Gangster sprite generation - 2026-11-15

Generated with the built-in image_gen tool. Original output: gangster_sheet.png.
Runtime frames: public/assets/gangster_0.png through gangster_3.png.

## Exact prompt

Use case: stylized-concept. Asset type: production sprite sheet for NEON WARPATH, original 2D side scrolling game. Create exactly FOUR full-body frames in ONE evenly spaced horizontal row, walk cycle of the SAME cyberpunk gangster, always facing LEFT and aiming compact submachine gun LEFT. Long charcoal coat, dark fedora, bright amber neon tie, steel boots, burgundy shirt, clear silhouette. Four distinct alternating leg strides, consistent head and gun height, same proportions and equipment every frame. 16-bit style detailed pixel art, strict side view, dark sci-fi action, hard pixel edges, limited palette, restrained rim highlights, no anti-aliasing blur. Flat solid magenta #FF00FF background everywhere including borders, no shadows, no glow, no floor, no text, no framing or grid lines. Generous equal empty spacing, no touching or cropped parts. Landscape sheet.

## Processing

`npm.cmd run assets -- --only gangster_sheet.png`

The pipeline removes magenta, scales the character to 66 pixels tall, adds the enemy outline, and anchors all four poses on 96x72 canvases. The existing enemy art resolver loads these frames automatically. Frames 2 and 4 are similar passing poses; refine the opposite leg silhouette in a later art pass if the walk reads too repetitive in motion.
