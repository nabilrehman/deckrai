#!/bin/bash
# Vector Search 2.0 Experiment: Complete End-to-End Test
#
# This script tests Vector Search 2.0 (Private Preview) with Collections API
# - Processes 37-slide PDF
# - Creates Collection with automatic embeddings
# - Uploads slides as Data Objects
# - Queries for "title slide"
# - Shows results with similarity scores
#
# Prerequisites:
# - gcloud CLI authenticated
# - poppler-utils (brew install poppler)
# - jq (brew install jq)
# - curl

set -e  # Exit on error

# Configuration
PROJECT_ID="deckr-477706"
LOCATION="us-central1"
COLLECTION_NAME="slide-library-test"
PDF_FILE="/Users/nabilrehman/Downloads/DA Mentor Led Hackathon _ Q4 2025.pdf"

# Vector Search 2.0 API endpoint (Private Preview)
# Note: This may require allowlist access
API_BASE="https://${LOCATION}-aiplatform.googleapis.com/v1alpha"
PROJECT_PATH="projects/${PROJECT_ID}/locations/${LOCATION}"

echo "🧪 Vector Search 2.0 Experiment"
echo "================================"
echo ""
echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Location: $LOCATION"
echo "   Collection: $COLLECTION_NAME"
echo "   PDF: $PDF_FILE"
echo ""

# Check if PDF exists
if [ ! -f "$PDF_FILE" ]; then
  echo "❌ Error: PDF file not found: $PDF_FILE"
  exit 1
fi

# Function to get access token
get_token() {
  gcloud auth print-access-token
}

# Function to make API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3

  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $(get_token)" \
      -H "Content-Type: application/json" \
      "$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $(get_token)" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$endpoint"
  fi
}

echo "⚙️  Step 1: Setting up gcloud..."
gcloud config set project $PROJECT_ID
echo "✅ Project set to $PROJECT_ID"
echo ""

echo "🔧 Step 2: Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID
echo "✅ Vertex AI API enabled"
echo ""

echo "📄 Step 3: Converting PDF to images..."
mkdir -p ./temp_slides_37

if ! command -v pdftoppm &> /dev/null; then
  echo "❌ Error: pdftoppm not found. Install with: brew install poppler"
  exit 1
fi

pdftoppm -png "$PDF_FILE" ./temp_slides_37/slide
SLIDE_COUNT=$(ls -1 ./temp_slides_37/*.png | wc -l | tr -d ' ')
echo "✅ Extracted $SLIDE_COUNT slides from PDF"
echo ""

echo "🗄️  Step 4: Creating Vector Search 2.0 Collection..."
echo "   Collection name: $COLLECTION_NAME"
echo ""

# Create collection with schema
# Schema: automatic embedding generation for slide images
COLLECTION_SCHEMA=$(cat <<EOF
{
  "displayName": "$COLLECTION_NAME",
  "description": "Presentation slide library with automatic multimodal embeddings",
  "vectorConfig": {
    "dimension": 512,
    "distanceMeasureType": "COSINE_DISTANCE"
  },
  "schema": {
    "properties": {
      "slide_id": {
        "type": "string",
        "description": "Unique slide identifier"
      },
      "slide_number": {
        "type": "integer",
        "description": "Position in deck"
      },
      "image_base64": {
        "type": "string",
        "description": "Base64-encoded slide image",
        "embedding": {
          "model": "multimodalembedding@001",
          "dimension": 512
        }
      },
      "deck_name": {
        "type": "string",
        "description": "Source deck name"
      }
    }
  }
}
EOF
)

# Note: Vector Search 2.0 Collections API is in private preview
# The endpoint structure is based on the announcement but may require access
echo "⚠️  Attempting to create collection (requires private preview access)..."
echo ""

COLLECTION_RESPONSE=$(api_call POST \
  "${API_BASE}/${PROJECT_PATH}/collections" \
  "$COLLECTION_SCHEMA" 2>&1)

if echo "$COLLECTION_RESPONSE" | grep -q "error"; then
  echo "⚠️  Collection creation response:"
  echo "$COLLECTION_RESPONSE" | jq '.' 2>/dev/null || echo "$COLLECTION_RESPONSE"
  echo ""
  echo "📌 Note: Vector Search 2.0 is in private preview."
  echo "   You may need to:"
  echo "   1. Request access via Google Cloud support"
  echo "   2. Join the allowlist for Vector Search 2.0"
  echo "   3. Check if the API endpoint is correct for your region"
  echo ""
  echo "🔄 Alternative: Testing with current Vector Search (GA)..."
  echo "   (This will use the standard index-based approach)"
  echo ""

  # Fallback to showing what would happen
  echo "📊 What Vector Search 2.0 would do:"
  echo "   1. Create Collection: '$COLLECTION_NAME'"
  echo "   2. Schema with auto-embedding for image_base64 field"
  echo "   3. Upload $SLIDE_COUNT slides as Data Objects"
  echo "   4. Auto-generate 512-dim embeddings via multimodalembedding@001"
  echo "   5. Enable instant queries (no endpoint deployment needed)"
  echo ""

  # Continue with embedding generation to show the data
  echo "📊 Generating embeddings manually to demonstrate data..."
  echo ""
else
  echo "✅ Collection created successfully!"
  COLLECTION_ID=$(echo "$COLLECTION_RESPONSE" | jq -r '.name' | awk -F'/' '{print $NF}')
  echo "   Collection ID: $COLLECTION_ID"
  echo ""
fi

echo "📊 Step 5: Generating multimodal embeddings for all $SLIDE_COUNT slides..."
echo ""

# Initialize data objects array
DATA_OBJECTS_FILE="./slide_data_objects.json"
> $DATA_OBJECTS_FILE
echo "[" >> $DATA_OBJECTS_FILE

slide_num=1
total_slides=$(ls -1 ./temp_slides_37/*.png | wc -l | tr -d ' ')

for slide_path in ./temp_slides_37/*.png; do
  echo "   [$slide_num/$total_slides] Processing $(basename $slide_path)..."

  # Convert image to base64
  base64_image=$(base64 -i "$slide_path" | tr -d '\n')

  # Generate embedding using Multimodal Embedding API
  embedding_request=$(cat <<EOF
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

  embedding_response=$(curl -s -X POST \
    -H "Authorization: Bearer $(get_token)" \
    -H "Content-Type: application/json" \
    -d "$embedding_request" \
    "https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict")

  embedding=$(echo "$embedding_response" | jq -c '.predictions[0].imageEmbedding')

  if [ "$embedding" = "null" ] || [ -z "$embedding" ]; then
    echo "      ❌ Failed to generate embedding"
    continue
  fi

  # Create data object
  data_object=$(cat <<EOF
{
  "id": "slide-$slide_num",
  "properties": {
    "slide_id": "slide-$slide_num",
    "slide_number": $slide_num,
    "deck_name": "DA Mentor Led Hackathon Q4 2025",
    "image_base64": "$base64_image"
  },
  "embedding": $embedding
}
EOF
)

  # Add to data objects array (with comma separation)
  if [ $slide_num -gt 1 ]; then
    echo "," >> $DATA_OBJECTS_FILE
  fi
  echo "$data_object" >> $DATA_OBJECTS_FILE

  echo "      ✅ Embedded (512-dim)"

  slide_num=$((slide_num + 1))
done

echo "]" >> $DATA_OBJECTS_FILE

echo ""
echo "✅ Generated embeddings for $((slide_num - 1)) slides"
echo "   Saved to: $DATA_OBJECTS_FILE"
echo ""

echo "☁️  Step 6: Uploading Data Objects to Collection..."

# Upload each data object to the collection
# Note: This requires the collection to exist
if [ ! -z "$COLLECTION_ID" ]; then
  echo "   Uploading to collection: $COLLECTION_ID"

  # Upload data objects in batch
  cat "$DATA_OBJECTS_FILE" | jq -c '.[]' | while read -r data_obj; do
    obj_id=$(echo "$data_obj" | jq -r '.id')
    echo "   Uploading $obj_id..."

    upload_response=$(api_call POST \
      "${API_BASE}/${PROJECT_PATH}/collections/${COLLECTION_ID}/dataObjects" \
      "$data_obj" 2>&1)

    if echo "$upload_response" | grep -q "error"; then
      echo "      ⚠️  Upload failed: $upload_response"
    else
      echo "      ✅ Uploaded"
    fi
  done

  echo ""
  echo "✅ Data objects uploaded"
  echo ""
else
  echo "   ⚠️  Skipping upload (collection not created due to preview access)"
  echo ""
fi

echo "🔍 Step 7: Querying for 'title slide'..."
echo ""

# Generate query embedding for "title slide"
query_request=$(cat <<EOF
{
  "instances": [{
    "text": "title slide presentation cover page"
  }],
  "parameters": {
    "dimension": 512
  }
}
EOF
)

query_response=$(curl -s -X POST \
  -H "Authorization: Bearer $(get_token)" \
  -H "Content-Type: application/json" \
  -d "$query_request" \
  "https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict")

query_embedding=$(echo "$query_response" | jq -c '.predictions[0].textEmbedding')

if [ "$query_embedding" = "null" ] || [ -z "$query_embedding" ]; then
  echo "❌ Failed to generate query embedding"
  exit 1
fi

echo "✅ Query embedding generated (512-dim)"
echo ""

# Search the collection
if [ ! -z "$COLLECTION_ID" ]; then
  echo "   Searching collection: $COLLECTION_ID"

  search_request=$(cat <<EOF
{
  "embedding": $query_embedding,
  "neighborCount": 5
}
EOF
)

  search_response=$(api_call POST \
    "${API_BASE}/${PROJECT_PATH}/collections/${COLLECTION_ID}:search" \
    "$search_request" 2>&1)

  echo ""
  echo "📊 Search Results:"
  echo ""

  if echo "$search_response" | grep -q "error"; then
    echo "⚠️  Search failed: $search_response"
  else
    echo "$search_response" | jq '.neighbors[] | "[\(.rank)] \(.id) - Similarity: \(.distance)"' 2>/dev/null || echo "$search_response"
  fi
  echo ""
else
  echo "   ⚠️  Skipping search (collection not available)"
  echo ""
  echo "   📌 If collection was created, you would query with:"
  echo "      POST ${API_BASE}/${PROJECT_PATH}/collections/{COLLECTION_ID}:search"
  echo ""
  echo "   🔍 Manual similarity search (computing locally)..."
  echo ""

  # Fallback: Manual cosine similarity calculation
  # Extract query embedding as array
  query_emb_array=$(echo "$query_embedding" | jq -r '.[]')

  # Calculate similarity with each slide
  echo "   Computing cosine similarity with all slides..."
  echo ""

  # Create a temporary Python script for similarity calculation
  cat > /tmp/calc_similarity.py <<'PYTHON_EOF'
import json
import sys
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Load data
data_objects = json.load(open(sys.argv[1]))
query_embedding = json.load(sys.stdin)

# Calculate similarities
results = []
for obj in data_objects:
    sim = cosine_similarity(query_embedding, obj['embedding'])
    results.append({
        'id': obj['id'],
        'slide_number': obj['properties']['slide_number'],
        'similarity': float(sim)
    })

# Sort by similarity
results.sort(key=lambda x: x['similarity'], reverse=True)

# Print top 10
print("\n📊 Top 10 Results (Cosine Similarity):\n")
for i, r in enumerate(results[:10]):
    print(f"[{i+1}] Slide {r['slide_number']:2d} ({r['id']}) - Similarity: {r['similarity']:.4f}")

print(f"\n📈 Statistics:")
print(f"   Total slides: {len(results)}")
print(f"   Top similarity: {results[0]['similarity']:.4f}")
print(f"   Median similarity: {results[len(results)//2]['similarity']:.4f}")
print(f"   Similarity gap (1st - 2nd): {results[0]['similarity'] - results[1]['similarity']:.4f}")
PYTHON_EOF

  # Run similarity calculation
  echo "$query_embedding" | python3 /tmp/calc_similarity.py "$DATA_OBJECTS_FILE"

  echo ""
fi

echo ""
echo "✅ Experiment Complete!"
echo ""
echo "📊 Summary:"
echo "   - Slides processed: $SLIDE_COUNT"
echo "   - Embeddings generated: 512 dimensions"
echo "   - Query: 'title slide presentation cover page'"
echo ""

if [ ! -z "$COLLECTION_ID" ]; then
  echo "✅ Vector Search 2.0 Collection created and tested"
  echo "   Collection ID: $COLLECTION_ID"
else
  echo "⚠️  Vector Search 2.0 requires private preview access"
  echo "   Manual similarity search completed as fallback"
fi

echo ""
echo "📝 Files created:"
echo "   - $DATA_OBJECTS_FILE (slide data objects with embeddings)"
echo "   - ./temp_slides_37/ (extracted slide images)"
echo ""
echo "🧹 Cleanup:"
echo "   rm -rf ./temp_slides_37"
echo "   rm $DATA_OBJECTS_FILE"
echo ""

# Cleanup temp Python script
rm -f /tmp/calc_similarity.py
