# Vector Search 2.0 Experiment: Slide Library Testing

## Overview

This experiment tests **Vertex AI Vector Search** (the current GA version, not "2.0" preview) for managing presentation slide libraries. The goal is to determine if vector similarity search can accurately categorize slides (e.g., identify "title slides") without making hundreds of API calls.

**Note:** "Vector Search 2.0" is currently in private preview and not publicly accessible. This experiment uses the GA version of Vertex AI Vector Search.

## What This Tests

1. **PDF Processing**: Convert multi-page PDF to individual slide images
2. **Multimodal Embeddings**: Generate 512-dimension vectors for each slide using Vertex AI's `multimodalembedding@001` model
3. **Vector Index Creation**: Build a searchable index using tree-AH algorithm
4. **Similarity Search**: Query for "title slide" and see which slides rank highest

## Expected Results

### Success Criteria
- ✅ Title slides rank in top 3 results
- ✅ Similarity scores > 0.80 for actual title slides
- ✅ No false positives (section dividers, closing slides) in top 3

### Potential Issues
- ⚠️ Visual similarity may cause confusion (title slides look like section dividers)
- ⚠️ Vector search alone may not be precise enough for category filtering
- ⚠️ May need hybrid approach: vector search + explicit categories

## Prerequisites

### 1. Install Required Tools

```bash
# macOS
brew install poppler  # For PDF conversion (pdftoppm)
brew install jq       # For JSON processing

# Verify installations
pdftoppm -v
jq --version
```

### 2. Authenticate with Google Cloud

```bash
# Login to gcloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Verify authentication
gcloud auth list
```

### 3. Set Project

```bash
gcloud config set project deckr-477706
```

## Running the Experiment

### Quick Start

```bash
cd experiments
chmod +x vector-search-gcloud-experiment.sh
./vector-search-gcloud-experiment.sh
```

### What the Script Does

**Phase 1: Setup (1-2 minutes)**
1. Enables required GCP APIs (Vertex AI, Cloud Storage)
2. Creates Cloud Storage bucket for embeddings
3. Converts PDF to PNG images using `pdftoppm`

**Phase 2: Embedding Generation (2-3 minutes)**
4. Generates 512-dimension multimodal embeddings for each slide
5. Uses Vertex AI Multimodal Embedding API
6. Saves embeddings in JSONL format

**Phase 3: Index Creation (30-60 minutes)**
7. Uploads embeddings to Cloud Storage
8. Creates Vector Search index metadata
9. Initiates index build (tree-AH algorithm)

**Phase 4: Manual Steps (documented in output)**
10. Wait for index to complete
11. Create index endpoint
12. Deploy index to endpoint
13. Query for "title slide"

## Cost Estimate

### API Calls
- **Multimodal Embedding**: ~$0.0025 per image (for 10 slides: $0.025)
- **Vector Search Index**: First 1M requests free, then $0.50 per 1K queries
- **Cloud Storage**: ~$0.02/GB/month (negligible for experiment)

**Total Experiment Cost: < $0.10**

### Long-Term Costs (Enterprise Scale: 2000 slides)
- **Embedding Generation**: 2000 × $0.0025 = **$5.00** (one-time)
- **Index Storage**: Free tier (< 10GB)
- **Query Costs**: ~$0.0005 per query (100 queries = $0.05)

**Annual Cost for 2000 slides: ~$10-20/year**

## Architecture: GA Vector Search vs. Vector Search 2.0

### Current GA Version (What We're Using)

**Architecture:**
```
PDF Slides → Multimodal Embeddings (512-dim) → Cloud Storage
                                                      ↓
                                         Vector Search Index (tree-AH)
                                                      ↓
                                         Index Endpoint (for queries)
```

**Components:**
- **Index**: Stores embeddings, built once
- **Endpoint**: Serves queries, requires deployment
- **Storage**: Separate Cloud Storage bucket for embeddings

**Pros:**
- ✅ GA (generally available), production-ready
- ✅ Well-documented with gcloud CLI support
- ✅ Free tier available

**Cons:**
- ❌ Requires separate endpoint management
- ❌ Manual index deployment step
- ❌ 30-60 minute index build time

### Vector Search 2.0 (Private Preview)

**Architecture:**
```
PDF Slides → Multimodal Embeddings → Collections (unified storage + index)
                                              ↓
                                      Auto-tuned queries (no endpoint needed)
```

**Components:**
- **Collection**: Combined storage + index
- **Data Objects**: Embeddings stored directly
- **Auto-tuning**: No manual endpoint management

**Pros:**
- ✅ Unified storage (no separate Cloud Storage)
- ✅ Simpler workflow (no endpoint deployment)
- ✅ Auto-tuned for performance

**Cons:**
- ❌ Private preview only (not publicly available)
- ❌ Limited documentation
- ❌ May require申请 access from Google

## Results Analysis

### After Running the Experiment

1. **Check Index Status**
```bash
gcloud ai indexes list --region=us-central1 --project=deckr-477706
```

2. **Analyze Embedding Distribution**
```bash
# View generated embeddings
cat ./slide_embeddings.json | jq .

# Count slides
cat ./slide_embeddings.json | wc -l
```

3. **Create Endpoint and Deploy**
```bash
# Create endpoint
gcloud ai index-endpoints create \
  --display-name=slide-library-endpoint \
  --region=us-central1 \
  --project=deckr-477706

# Get index ID from list command
INDEX_ID=$(gcloud ai indexes list --region=us-central1 --format="value(name)")

# Get endpoint ID
ENDPOINT_ID=$(gcloud ai index-endpoints list --region=us-central1 --format="value(name)")

# Deploy index to endpoint (takes ~10 minutes)
gcloud ai index-endpoints deploy-index $ENDPOINT_ID \
  --deployed-index-id=slide_library_v1 \
  --index=$INDEX_ID \
  --display-name=slide-library-deployed \
  --region=us-central1
```

4. **Query for "Title Slide"**
```bash
# Step 1: Generate query embedding
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "text": "title slide presentation cover page"
    }],
    "parameters": {
      "dimension": 512
    }
  }' \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/deckr-477706/locations/us-central1/publishers/google/models/multimodalembedding@001:predict" \
  | jq '.predictions[0].textEmbedding' > query_embedding.json

# Step 2: Query the index (replace ENDPOINT_ID)
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d "{
    \"deployed_index_id\": \"slide_library_v1\",
    \"queries\": [{
      \"embedding\": $(cat query_embedding.json),
      \"neighbor_count\": 5
    }]
  }" \
  "https://ENDPOINT_ID.us-central1.aiplatform.googleapis.com/v1/projects/deckr-477706/locations/us-central1/indexEndpoints/ENDPOINT_ID:findNeighbors"
```

5. **Evaluate Results**
```
Expected output:
{
  "nearestNeighbors": [{
    "neighbors": [
      {"datapoint": {"datapointId": "slide-1"}, "distance": 0.95},  ← Should be title slide
      {"datapoint": {"datapointId": "slide-2"}, "distance": 0.72},
      {"datapoint": {"datapointId": "slide-3"}, "distance": 0.68}
    ]
  }]
}

✅ Success: slide-1 is the actual title slide with high similarity (0.95)
⚠️ Concern: Other slides have moderate similarity (0.72, 0.68) - are they false positives?
```

### Quality Metrics to Track

1. **Precision**: Of top 3 results, how many are actual title slides?
   - Target: > 90%

2. **Recall**: Of all title slides in the library, how many appear in top 5?
   - Target: 100%

3. **False Positive Rate**: How many non-title slides rank in top 3?
   - Target: < 10%

4. **Similarity Gap**: Difference between highest and 2nd highest score
   - Target: > 0.15 (clear winner)

## Next Steps Based on Results

### If Results Are Good (Precision > 90%)
✅ Implement Vector Search for slide categorization
- Use lazy categorization (categorize on first query)
- Cache categories in Firestore after first classification
- Hybrid approach: vector search + cached categories

### If Results Are Poor (Precision < 70%)
❌ Stick with explicit categorization
- Require users to tag slides during upload
- Use AI for suggested categories, not automatic classification
- Vector search only for ranking within categories

## Troubleshooting

### Error: "pdftoppm: command not found"
```bash
brew install poppler
```

### Error: "Permission denied when calling Vertex AI API"
```bash
gcloud auth application-default login
```

### Error: "Index creation failed"
Check:
- Embeddings file format (must be JSONL)
- Dimension match (512 in metadata = 512 in embeddings)
- Cloud Storage permissions

### Index build taking too long (> 2 hours)
This is unusual. Check:
```bash
gcloud ai operations list --region=us-central1
```

## Files Generated

- `./slide_embeddings.json` - JSONL file with slide embeddings
- `./index_metadata.json` - Index configuration
- `./temp_slides/*.png` - Extracted slide images
- `./query_embedding.json` - Query embedding for "title slide"

## Cleanup

```bash
# Delete local files
rm -rf ./temp_slides
rm ./slide_embeddings.json ./index_metadata.json ./query_embedding.json

# Delete Cloud Storage bucket
gsutil -m rm -r gs://deckr-vector-search-experiment

# Delete index (get ID first)
INDEX_ID=$(gcloud ai indexes list --region=us-central1 --format="value(name)")
gcloud ai indexes delete $INDEX_ID --region=us-central1

# Delete endpoint (get ID first)
ENDPOINT_ID=$(gcloud ai index-endpoints list --region=us-central1 --format="value(name)")
gcloud ai index-endpoints delete $ENDPOINT_ID --region=us-central1
```

## References

- [Vertex AI Vector Search Documentation](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Multimodal Embeddings API](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings)
- [gcloud ai indexes create](https://cloud.google.com/sdk/gcloud/reference/ai/indexes/create)
