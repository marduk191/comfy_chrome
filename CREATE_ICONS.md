# Icon Creation Instructions

The extension requires PNG icons in the following sizes:
- 16x16 pixels (icon16.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

## Option 1: Use the provided SVG

An SVG icon is provided in `icons/icon.svg`. You can convert it to PNG using:

### Using online converter:
1. Visit https://cloudconvert.com/svg-to-png
2. Upload `icons/icon.svg`
3. Convert to the required sizes
4. Save as icon16.png, icon48.png, and icon128.png in the `icons/` folder

### Using Inkscape (if installed):
```bash
inkscape icons/icon.svg -w 16 -h 16 -o icons/icon16.png
inkscape icons/icon.svg -w 48 -h 48 -o icons/icon48.png
inkscape icons/icon.svg -w 128 -h 128 -o icons/icon128.png
```

### Using ImageMagick (if installed):
```bash
convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
```

## Option 2: Use your own icons

Replace the icon files in the `icons/` folder with your own custom icons in the sizes listed above.

## Option 3: Temporary Placeholder

For testing purposes, you can create simple placeholder icons using any image editor or even online tools.
The extension will work as long as the three PNG files exist in the `icons/` folder.
