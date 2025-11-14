#!/usr/bin/env python3
"""Generate simple icons for the Chrome extension"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a simple icon with the ComfyUI theme"""
    # Create a new image with a gradient-like background
    img = Image.new('RGB', (size, size), color='#4CAF50')
    draw = ImageDraw.Draw(img)

    # Draw a simple "C" shape to represent ComfyUI
    margin = size // 6

    # Draw white "C" shape
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill='white',
        outline='white'
    )

    # Cut out the inner circle
    inner_margin = margin + size // 8
    draw.ellipse(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        fill='#4CAF50',
        outline='#4CAF50'
    )

    # Cut out the right side to make it look like a "C"
    draw.rectangle(
        [size // 2, margin, size - margin, size - margin],
        fill='#4CAF50',
        outline='#4CAF50'
    )

    # Save the image
    img.save(output_path, 'PNG')
    print(f'Created {output_path}')

if __name__ == '__main__':
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)

    # Generate icons in different sizes
    sizes = {
        'icon16.png': 16,
        'icon48.png': 48,
        'icon128.png': 128
    }

    for filename, size in sizes.items():
        create_icon(size, os.path.join('icons', filename))

    print('All icons generated successfully!')
