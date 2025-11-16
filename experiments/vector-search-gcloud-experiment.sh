#!/bin/bash
# Vector Search Experiment: Test with PDF Slides
#
# This script demonstrates how to:
# 1. Convert PDF to images
# 2. Generate multimodal embeddings using Vertex AI
# 3. Create a Vector Search index
# 4. Upload slide embeddings
# 5. Query for "title slide"
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - poppler-utils for PDF conversion (brew install poppler)
# - jq for JSON processing (brew install jq)

set -e  # Exit on error

# Configuration
PROJECT_ID="deckr-477706"
LOCATION="us-central1"
BUCKET_NAME="deckr-vector-search-experiment"
INDEX_NAME="slide-library-test"
PDF_FILE="../title_slide.pdf"

echo "🧪 Vector Search Experiment"
echo "============================"
echo ""
echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Location: $LOCATION"
echo "   Bucket: gs://$BUCKET_NAME"
echo "   Index: $INDEX_NAME"
echo "   PDF: $PDF_FILE"
echo ""

# Step 1: Set gcloud project
echo "⚙️  Step 1: Setting gcloud project..."
gcloud config set project $PROJECT_ID
echo "✅ Project set to $PROJECT_ID"
echo ""

# Step 2: Enable required APIs
echo "🔧 Step 2: Enabling required APIs..."
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  --project=$PROJECT_ID
echo "✅ APIs enabled"
echo ""

# Step 3: Create Cloud Storage bucket (if not exists)
echo "🪣 Step 3: Creating Cloud Storage bucket..."
if gsutil ls -b gs://$BUCKET_NAME 2>/dev/null; then
  echo "✅ Bucket already exists: gs://$BUCKET_NAME"
else
  gsutil mb -p $PROJECT_ID -l $LOCATION gs://$BUCKET_NAME
  echo "✅ Bucket created: gs://$BUCKET_NAME"
fi
echo ""

# Step 4: Convert PDF to images
echo "📄 Step 4: Converting PDF to images..."
mkdir -p ./temp_slides

if ! command -v pdftoppm &> /dev/null; then
  echo "❌ Error: pdftoppm not found. Install with: brew install poppler"
  exit 1
fi

pdftoppm -png "$PDF_FILE" ./temp_slides/slide
SLIDE_COUNT=$(ls -1 ./temp_slides/*.png | wc -l | tr -d ' ')
echo "✅ Extracted $SLIDE_COUNT slides from PDF"
echo ""

# Step 5: Generate multimodal embeddings for each slide
echo "📊 Step 5: Generating multimodal embeddings..."
echo ""

# Initialize embeddings JSON file
EMBEDDINGS_FILE="./slide_embeddings.json"
> $EMBEDDINGS_FILE  # Clear file

# Function to generate embedding for a slide
generate_embedding() {
  local slide_path=$1
  local slide_num=$2
  local slide_id="slide-$slide_num"

  echo "   Processing slide $slide_num/$SLIDE_COUNT..."

  # Convert image to base64
  local base64_image=$(base64 -i "$slide_path" | tr -d '\n')

  # Create request body
  local request_body=$(cat <<EOF
{
  "instances": [{
    "text": "presentation slide",
    "image": {
      "bytesBase64Encoded": "$base64_image"
    }
  }],
  "parameters": {
    "dimension": 512
  }
}
EOF
)

  # Call Vertex AI Multimodal Embedding API
  local response=$(curl -s -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    -d "$request_body" \
    "https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict")

  # Extract embedding from response
  local embedding=$(echo "$response" | jq -c '.predictions[0].imageEmbedding')

  if [ "$embedding" = "null" ] || [ -z "$embedding" ]; then
    echo "   ❌ Failed to generate embedding for slide $slide_num"
    echo "   Response: $response"
    return 1
  fi

  # Append to JSONL file (newline-delimited JSON)
  echo "{\"id\": \"$slide_id\", \"embedding\": $embedding}" >> $EMBEDDINGS_FILE

  echo "   ✅ Slide $slide_num embedded (512 dimensions)"
}

# Generate embeddings for all slides
slide_num=1
for slide_path in ./temp_slides/*.png; do
  generate_embedding "$slide_path" "$slide_num"
  slide_num=$((slide_num + 1))
done

echo ""
echo "✅ Generated embeddings for $SLIDE_COUNT slides"
echo "   File: $EMBEDDINGS_FILE"
echo ""

# Step 6: Upload embeddings to Cloud Storage
echo "☁️  Step 6: Uploading embeddings to Cloud Storage..."
gsutil cp $EMBEDDINGS_FILE gs://$BUCKET_NAME/embeddings/slide_embeddings.json
echo "✅ Embeddings uploaded to gs://$BUCKET_NAME/embeddings/"
echo ""

# Step 7: Create Vector Search index metadata
echo "🔧 Step 7: Creating index metadata..."

INDEX_METADATA_FILE="./index_metadata.json"
cat > $INDEX_METADATA_FILE <<EOF
{
  "contentsDeltaUri": "gs://$BUCKET_NAME/embeddings",
  "config": {
    "dimensions": 512,
    "approximateNeighborsCount": 10,
    "distanceMeasureType": "DOT_PRODUCT_DISTANCE",
    "shardSize": "SHARD_SIZE_SMALL",
    "algorithmConfig": {
      "treeAhConfig": {
        "leafNodeEmbeddingCount": 1000,
        "fractionLeafNodesToSearch": 0.05
      }
    }
  }
}
EOF

echo "✅ Index metadata created: $INDEX_METADATA_FILE"
echo ""

# Step 8: Create Vector Search index
echo "🏗️  Step 8: Creating Vector Search index..."
echo "   ⚠️  Note: This can take 30+ minutes to complete"
echo ""

gcloud ai indexes create \
  --metadata-file=$INDEX_METADATA_FILE \
  --display-name=$INDEX_NAME \
  --region=$LOCATION \
  --project=$PROJECT_ID

echo "✅ Index creation initiated"
echo ""

# Step 9: Wait for index to be ready
echo "⏳ Step 9: Waiting for index to be ready..."
echo "   Run this command to check status:"
echo "   gcloud ai indexes list --region=$LOCATION --project=$PROJECT_ID"
echo ""

# Step 10: Instructions for querying
echo "🔍 Step 10: How to Query for 'Title Slide'"
echo ""
echo "Once the index is deployed to an endpoint, query with:"
echo ""
echo "1. Generate query embedding for 'title slide':"
echo ""
cat <<'EOF'
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "text": "title slide presentation cover"
    }],
    "parameters": {
      "dimension": 512
    }
  }' \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/deckr-477706/locations/us-central1/publishers/google/models/multimodalembedding@001:predict"
EOF
echo ""
echo "2. Extract the text embedding from response"
echo ""
echo "3. Query the index endpoint with the embedding:"
echo ""
cat <<'EOF'
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "deployed_index_id": "YOUR_DEPLOYED_INDEX_ID",
    "queries": [{
      "embedding": [/* query embedding array */],
      "neighbor_count": 5
    }]
  }' \
  "https://ENDPOINT_ID.LOCATION.aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/indexEndpoints/ENDPOINT_ID:findNeighbors"
EOF
echo ""

echo "📊 Experiment Summary"
echo "====================="
echo ""
echo "✅ What we tested:"
echo "   - PDF to image conversion: $SLIDE_COUNT slides"
echo "   - Multimodal embedding generation: 512 dimensions"
echo "   - Vector Search index creation: tree-AH algorithm"
echo "   - Data upload to Cloud Storage"
echo ""
echo "⏳ Next steps (manual):"
echo "   1. Wait for index to complete building (~30-60 minutes)"
echo "   2. Create index endpoint:"
echo "      gcloud ai index-endpoints create --display-name=${INDEX_NAME}-endpoint --region=$LOCATION"
echo "   3. Deploy index to endpoint (see documentation)"
echo "   4. Query for 'title slide' and evaluate results"
echo ""
echo "📝 Files created:"
echo "   - $EMBEDDINGS_FILE (slide embeddings)"
echo "   - $INDEX_METADATA_FILE (index configuration)"
echo "   - ./temp_slides/ (extracted slide images)"
echo ""
echo "🧹 Cleanup (when done):"
echo "   rm -rf ./temp_slides"
echo "   gsutil -m rm -r gs://$BUCKET_NAME"
echo "   gcloud ai indexes delete INDEX_ID --region=$LOCATION"
echo ""
