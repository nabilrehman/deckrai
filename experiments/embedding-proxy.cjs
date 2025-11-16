/**
 * Embedding Proxy Server
 *
 * Runs a local server that proxies requests to Vertex AI Multimodal Embedding API
 * This solves the CORS issue when calling from the browser
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const PORT = 3001;
const PROJECT_ID = 'deckr-477706';
const LOCATION = 'us-central1';

// Get access token
async function getAccessToken() {
  try {
    const { stdout } = await execPromise('gcloud auth print-access-token');
    return stdout.trim();
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

// Call Vertex AI Multimodal Embedding API
async function generateEmbedding(imageBase64, text = "presentation slide") {
  const accessToken = await getAccessToken();

  const requestBody = JSON.stringify({
    instances: [{
      text,
      image: {
        bytesBase64Encoded: imageBase64
      }
    }],
    parameters: {
      dimension: 512
    }
  });

  const options = {
    hostname: `${LOCATION}-aiplatform.googleapis.com`,
    path: `/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.predictions && response.predictions[0]) {
            resolve(response.predictions[0].imageEmbedding);
          } else {
            reject(new Error('No embedding in response: ' + data));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

// Generate text embedding for query
async function generateTextEmbedding(text) {
  const accessToken = await getAccessToken();

  const requestBody = JSON.stringify({
    instances: [{
      text
    }],
    parameters: {
      dimension: 512
    }
  });

  const options = {
    hostname: `${LOCATION}-aiplatform.googleapis.com`,
    path: `/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.predictions && response.predictions[0]) {
            resolve(response.predictions[0].textEmbedding);
          } else {
            reject(new Error('No embedding in response: ' + data));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST requests
  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        let embedding;
        if (req.url === '/embed/image') {
          // Generate image embedding
          console.log(`🖼️  Generating embedding for slide ${data.slideId}...`);
          embedding = await generateEmbedding(data.imageBase64, data.text);
          console.log(`✅ Generated embedding for slide ${data.slideId}`);
        } else if (req.url === '/embed/text') {
          // Generate text embedding
          console.log(`📝 Generating embedding for query: "${data.text}"`);
          embedding = await generateTextEmbedding(data.text);
          console.log(`✅ Generated text embedding`);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ embedding }));
      } catch (error) {
        console.error('❌ Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method not allowed');
  }
});

server.listen(PORT, () => {
  console.log('🚀 Embedding Proxy Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📋 Project: ${PROJECT_ID}`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log('');
  console.log('📡 Endpoints:');
  console.log(`   POST http://localhost:${PORT}/embed/image`);
  console.log(`   POST http://localhost:${PORT}/embed/text`);
  console.log('');
  console.log('💡 Now refresh the browser experiment and run again!');
  console.log('   The experiment will use REAL embeddings from Vertex AI');
  console.log('');
});
