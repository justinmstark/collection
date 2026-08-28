#!/usr/bin/env bash
# Remove white/solid backgrounds from all bottle images in MinIO using rembg
set -euo pipefail

MINIO_URL="http://localhost:9000"
BUCKET="collection-images"
ACCESS_KEY="minioadmin"
SECRET_KEY="minioadmin"
MODEL="${1:-birefnet-general}"
TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

echo "Model: $MODEL"
echo "Working directory: $TMPDIR_WORK"
echo ""

# List all keys
KEYS=$(curl -s --aws-sigv4 "aws:amz:us-east-1:s3" --user "$ACCESS_KEY:$SECRET_KEY" \
  "$MINIO_URL/$BUCKET?list-type=2" \
  | python3 -c "import sys,xml.etree.ElementTree as ET; root=ET.fromstring(sys.stdin.read()); ns={'s':'http://s3.amazonaws.com/doc/2006-03-01/'}; [print(k.text) for k in root.findall('.//s:Key', ns)]")

TOTAL=$(echo "$KEYS" | wc -l | tr -d ' ')
echo "Found $TOTAL images to process"
echo ""

COUNT=0
for KEY in $KEYS; do
  COUNT=$((COUNT + 1))
  FILENAME=$(basename "$KEY")
  BASE="${FILENAME%.*}"
  INPUT="$TMPDIR_WORK/${BASE}_orig.png"
  OUTPUT="$TMPDIR_WORK/${BASE}_nobg.png"
  NEW_KEY="${KEY%/*}/${BASE}.png"

  printf "[%d/%d] %s ... " "$COUNT" "$TOTAL" "$KEY"

  # Download
  curl -sf --aws-sigv4 "aws:amz:us-east-1:s3" --user "$ACCESS_KEY:$SECRET_KEY" \
    -o "$INPUT" \
    "$MINIO_URL/$BUCKET/$KEY" || { echo "download failed"; continue; }

  # Remove background with specified model
  rembg i -m "$MODEL" "$INPUT" "$OUTPUT" 2>/dev/null || { echo "rembg failed"; continue; }

  # Upload as PNG
  curl -sf -X PUT \
    --aws-sigv4 "aws:amz:us-east-1:s3" --user "$ACCESS_KEY:$SECRET_KEY" \
    -H "Content-Type: image/png" \
    --data-binary "@$OUTPUT" \
    "$MINIO_URL/$BUCKET/$NEW_KEY" || { echo "upload failed"; continue; }

  echo "✓"
done

echo ""
echo "Done. $COUNT images processed with $MODEL."
