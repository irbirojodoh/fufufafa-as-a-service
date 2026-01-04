#!/bin/bash

# FUaaS Image Upload Script
# Uploads all images to Cloudflare R2 bucket

set -e

# Configuration
IMG_DIR="../data-extraction/scraped-images"
BUCKET_NAME="fuaas-images"

echo "Uploading images to R2 bucket: $BUCKET_NAME"
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Please install it with:"
    echo "  npm install -g wrangler"
    exit 1
fi

# Upload each image
count=0
for file in "$IMG_DIR"/*.png; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Convert filename like "001.png" to "1.png" for consistency
        id=$(echo "$filename" | sed 's/^0*//' | sed 's/\.png$//')
        newname="${id}.png"
        
        echo "Uploading: $filename -> $newname"
        wrangler r2 object put "$BUCKET_NAME/$newname" --file="$file" --content-type="image/png" --remote
        
        count=$((count + 1))
    fi
done

echo ""
echo "Done! Uploaded $count images to $BUCKET_NAME"
