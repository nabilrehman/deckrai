# Slide RAG Optimization Plan

## Current Configuration (Baseline)
- **Dimensions**: 1408 (maximum context)
- **Distance Metric**: COSINE_DISTANCE
- **Update Method**: STREAM_UPDATE
- **Algorithm**: tree-AH
- **Shard Size**: Small
- **Approximate Neighbors**: 150
- **Leaf Node Count**: 1000

## Optimization Levels

### Level 1: Quick Wins (If results are okay but could be better)

1. **Add Slide Type Metadata**
   - Extract slide type during indexing: `title`, `content`, `chart`, `diagram`, `team`, `closing`
   - Add as restrict filter in Vector Search
   - Allows queries like "find all title slides" with pre-filtering

2. **Increase topK for Better Recall**
   - Default topK: 10
   - Try topK: 20-50 for more diverse results
   - Let Gemini pick the best from larger pool

3. **Tune Leaf Nodes to Search Percent**
   - Current: 10%
   - If missing relevant results: increase to 15-20%
   - Trade-off: higher = better recall, slower search

### Level 2: Moderate Changes (If results are mediocre)

4. **Hybrid Search with Text Embeddings**
   ```
   Image embedding (1408-dim) → Vector Search → Results A
   Text description embedding → Vector Search → Results B
   Weighted RRF(A, B) → Final Results
   ```
   - Use Gemini to generate text descriptions during indexing
   - Store both image and text embeddings
   - Combine with weighted Reciprocal Rank Fusion

5. **Add Contextual Metadata**
   - Deck name, industry, company type
   - Color palette hash (for style matching)
   - Slide position (intro/middle/conclusion)

6. **Re-ranking Layer**
   - After Vector Search returns top 50
   - Use Gemini to re-rank based on query intent
   - Return top 10 after re-ranking

### Level 3: Major Changes (If results are poor)

7. **Multi-Vector Representation**
   - Split slide into regions (header, body, footer)
   - Generate embedding per region
   - Search with region-aware queries

8. **Fine-tuned Embeddings**
   - Collect feedback on search quality
   - Fine-tune embedding model for presentation domain
   - Requires significant data collection

9. **Switch to Lower Dimensions**
   - Try 512-dim for faster search
   - Compare quality vs 1408-dim
   - Use 1408 for indexing, 512 for query (if supported)

### Level 4: Alternative Approaches

10. **BigQuery Vector Search**
    - Store embeddings in BigQuery
    - SQL-based filtering with vector similarity
    - Better for complex metadata queries

11. **Gemini Vision Direct**
    - Skip embeddings for small datasets
    - Send candidate slides directly to Gemini
    - More expensive but potentially more accurate

## Metrics to Track

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Precision@10 | >0.7 | Relevant slides in top 10 / 10 |
| Recall@50 | >0.9 | Relevant found in top 50 / total relevant |
| Latency (p50) | <500ms | Time from query to results |
| Latency (p99) | <2s | Worst case response time |
| User satisfaction | >4/5 | Feedback on search results |

## Testing Queries

Use these queries to evaluate search quality:

### Design/Style Queries
- "modern minimalist title slide"
- "dark theme with gradient background"
- "corporate blue color scheme"

### Content Type Queries
- "architecture diagram"
- "revenue chart"
- "team introduction slide"
- "product comparison table"

### Industry Queries
- "startup pitch deck"
- "enterprise sales presentation"
- "technical documentation"

### Semantic Queries
- "slide showing growth"
- "problem statement"
- "call to action"

## Implementation Priority

1. ✅ Basic Vector Search (DONE)
2. 🔄 Test with real slides
3. ⏳ Add slide type metadata
4. ⏳ Implement hybrid search
5. ⏳ Add re-ranking layer
