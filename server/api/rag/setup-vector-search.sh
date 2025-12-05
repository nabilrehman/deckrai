#!/bin/bash
#
# Setup Vertex AI Vector Search for Slide RAG
#
# This script creates:
# 1. A Vector Search Index (for storing slide embeddings)
# 2. An Index Endpoint (for querying)
# 3. Deploys the index to the endpoint
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Project ID set to bq-demos-469816
#
# Usage: ./setup-vector-search.sh

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-bq-demos-469816}"
LOCATION="us-central1"
INDEX_DISPLAY_NAME="slide-rag-index"
INDEX_ENDPOINT_DISPLAY_NAME="slide-rag-endpoint"
DEPLOYED_INDEX_ID="slide_rag_deployed"

# Embedding dimensions (multimodalembedding@001 uses 1408)
DIMENSIONS=1408

echo "=============================================="
echo "Setting up Vertex AI Vector Search"
echo "=============================================="
echo "Project: $PROJECT_ID"
echo "Location: $LOCATION"
echo "Dimensions: $DIMENSIONS"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com

# Step 1: Create the Vector Search Index
echo ""
echo "Step 1: Creating Vector Search Index..."
echo ""

# Check if index already exists
EXISTING_INDEX=$(gcloud ai indexes list --region=$LOCATION --format="value(name)" --filter="displayName=$INDEX_DISPLAY_NAME" 2>/dev/null || true)

if [ -n "$EXISTING_INDEX" ]; then
    echo "Index already exists: $EXISTING_INDEX"
    INDEX_ID=$(basename $EXISTING_INDEX)
else
    # Create index with streaming updates enabled
    gcloud ai indexes create \
        --region=$LOCATION \
        --display-name="$INDEX_DISPLAY_NAME" \
        --description="Vector index for slide RAG with multimodal embeddings" \
        --metadata-schema-uri="gs://google-cloud-aiplatform/schema/matchingengine/metadata/nearest_neighbor_search_1.0.0.yaml" \
        --metadata='{"contentsDeltaUri":"","config":{"dimensions":'$DIMENSIONS',"approximateNeighborsCount":150,"distanceMeasureType":"COSINE_DISTANCE","algorithmConfig":{"treeAhConfig":{"leafNodeEmbeddingCount":1000,"leafNodesToSearchPercent":10}},"shardSize":"SHARD_SIZE_SMALL"}}' \
        --index-update-method=STREAM_UPDATE

    # Wait for index creation
    echo "Waiting for index creation..."
    sleep 30

    INDEX_ID=$(gcloud ai indexes list --region=$LOCATION --format="value(name)" --filter="displayName=$INDEX_DISPLAY_NAME" | head -1)
    INDEX_ID=$(basename $INDEX_ID)
fi

echo "Index ID: $INDEX_ID"

# Step 2: Create the Index Endpoint
echo ""
echo "Step 2: Creating Index Endpoint..."
echo ""

# Check if endpoint already exists
EXISTING_ENDPOINT=$(gcloud ai index-endpoints list --region=$LOCATION --format="value(name)" --filter="displayName=$INDEX_ENDPOINT_DISPLAY_NAME" 2>/dev/null || true)

if [ -n "$EXISTING_ENDPOINT" ]; then
    echo "Index Endpoint already exists: $EXISTING_ENDPOINT"
    ENDPOINT_ID=$(basename $EXISTING_ENDPOINT)
else
    gcloud ai index-endpoints create \
        --region=$LOCATION \
        --display-name="$INDEX_ENDPOINT_DISPLAY_NAME" \
        --description="Public endpoint for slide RAG queries" \
        --public-endpoint-enabled

    # Wait for endpoint creation
    echo "Waiting for endpoint creation..."
    sleep 30

    ENDPOINT_ID=$(gcloud ai index-endpoints list --region=$LOCATION --format="value(name)" --filter="displayName=$INDEX_ENDPOINT_DISPLAY_NAME" | head -1)
    ENDPOINT_ID=$(basename $ENDPOINT_ID)
fi

echo "Endpoint ID: $ENDPOINT_ID"

# Step 3: Deploy Index to Endpoint
echo ""
echo "Step 3: Deploying Index to Endpoint..."
echo ""

# Check if already deployed
EXISTING_DEPLOYMENT=$(gcloud ai index-endpoints describe $ENDPOINT_ID --region=$LOCATION --format="value(deployedIndexes)" 2>/dev/null || true)

if [[ "$EXISTING_DEPLOYMENT" == *"$DEPLOYED_INDEX_ID"* ]]; then
    echo "Index already deployed with ID: $DEPLOYED_INDEX_ID"
else
    gcloud ai index-endpoints deploy-index $ENDPOINT_ID \
        --region=$LOCATION \
        --deployed-index-id="$DEPLOYED_INDEX_ID" \
        --display-name="Slide RAG Deployed Index" \
        --index=$INDEX_ID \
        --min-replica-count=1 \
        --max-replica-count=2

    echo "Deploying... This may take 20-30 minutes."
fi

# Output configuration
echo ""
echo "=============================================="
echo "Setup Complete!"
echo "=============================================="
echo ""
echo "Add these environment variables to your deployment:"
echo ""
echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
echo "VERTEX_AI_LOCATION=$LOCATION"
echo "VECTOR_SEARCH_INDEX_ENDPOINT=$ENDPOINT_ID"
echo "VECTOR_SEARCH_DEPLOYED_INDEX=$DEPLOYED_INDEX_ID"
echo ""
echo "For Cloud Run deployment, add these to cloudbuild.rag.yaml"
echo ""
