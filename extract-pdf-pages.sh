#!/bin/bash
# Extract PDF pages as images for testing

PDF_PATH="/Users/nabilrehman/Downloads/DA Mentor Led Hackathon _ Q4 2025.pdf"
OUTPUT_DIR="/Users/nabilrehman/Downloads/deckr-test-references"

echo "📄 Extracting PDF pages for testing..."
echo "PDF: $PDF_PATH"
echo "Output: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    echo "Run: brew install imagemagick"
    echo ""
    echo "Alternative: Open the PDF in Preview and manually export pages 1-5 as PNG files"
    exit 1
fi

# Extract first 5 pages as PNG (300 DPI for quality)
echo "🖼️  Extracting pages 1-5..."
convert -density 300 "$PDF_PATH[0-4]" -quality 90 "$OUTPUT_DIR/google-cloud-page-%d.png"

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Extracted pages to: $OUTPUT_DIR"
    echo ""
    echo "Files created:"
    ls -lh "$OUTPUT_DIR"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open http://localhost:3003"
    echo "2. Navigate to Style Library"
    echo "3. Upload the extracted PNG files from: $OUTPUT_DIR"
    echo "4. Follow the testing guide in TESTING-GUIDE.md"
else
    echo ""
    echo "❌ Extraction failed. Try manual export:"
    echo "1. Open PDF in Preview: $PDF_PATH"
    echo "2. File → Export → Format: PNG"
    echo "3. Check 'Export pages 1-5'"
    echo "4. Save to: $OUTPUT_DIR"
fi
