import { auth } from '../config/firebase';

const GOOGLE_SLIDES_API = 'https://slides.googleapis.com/v1';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';

// OAuth scopes needed for Google Slides
const SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive.file'
];

/**
 * Get access token with Google Slides scopes
 * Firebase Auth doesn't automatically grant these scopes, so we need to prompt the user
 */
export const getGoogleAccessToken = async (): Promise<string> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error('User must be signed in to export to Google Slides');
    }

    // Get the Firebase ID token
    const idToken = await currentUser.getIdToken();

    // Check if we already have an access token in sessionStorage
    const cachedToken = sessionStorage.getItem('google_access_token');
    const cachedExpiry = sessionStorage.getItem('google_token_expiry');

    if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
        return cachedToken;
    }

    // Initiate OAuth flow for additional scopes
    // Get client ID from environment or use Firebase project client ID
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '948199894623-9odc42p9rh38f0ohgvgn5afs0qqbvhm2.apps.googleusercontent.com';
    const redirectUri = window.location.origin;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
        `state=google_slides_export&` +
        `prompt=consent`;

    // Open OAuth popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    console.log('[OAuth] Opening popup for Google authorization...');
    console.log('[OAuth] Auth URL:', authUrl);

    const popup = window.open(
        authUrl,
        'Google Slides Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
        throw new Error('Popup was blocked by browser. Please allow popups for this site.');
    }

    // Listen for messages from the popup (better than polling)
    return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
            // Verify origin for security
            if (event.origin !== window.location.origin) return;

            console.log('[OAuth] Received message from popup:', event.data);

            if (event.data.type === 'google_oauth_success') {
                window.removeEventListener('message', messageHandler);
                clearInterval(checkPopup);
                clearTimeout(timeout);
                popup?.close();

                const token = event.data.accessToken;
                const expiresIn = event.data.expiresIn;

                if (token && expiresIn) {
                    const expiry = Date.now() + parseInt(expiresIn) * 1000;
                    sessionStorage.setItem('google_access_token', token);
                    sessionStorage.setItem('google_token_expiry', expiry.toString());
                    console.log('[OAuth] Token saved successfully');
                    resolve(token);
                } else {
                    reject(new Error('Invalid token received from OAuth'));
                }
            } else if (event.data.type === 'google_oauth_error') {
                window.removeEventListener('message', messageHandler);
                clearInterval(checkPopup);
                clearTimeout(timeout);
                popup?.close();
                reject(new Error(event.data.error || 'OAuth authorization failed'));
            }
        };

        window.addEventListener('message', messageHandler);

        // Fallback: Also check if popup closed (in case message doesn't work)
        const checkPopup = setInterval(() => {
            if (popup?.closed) {
                console.log('[OAuth] Popup was closed');
                window.removeEventListener('message', messageHandler);
                clearInterval(checkPopup);
                clearTimeout(timeout);

                const token = sessionStorage.getItem('google_access_token');
                if (token) {
                    console.log('[OAuth] Found token in sessionStorage');
                    resolve(token);
                } else {
                    reject(new Error('Authorization window was closed. Please try again and click "Allow" to grant permissions.'));
                }
            }
        }, 500);

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
            console.log('[OAuth] Timeout reached');
            window.removeEventListener('message', messageHandler);
            clearInterval(checkPopup);
            popup?.close();
            reject(new Error('Authorization timed out after 2 minutes'));
        }, 120000);
    });
};

/**
 * Handle OAuth callback (parse hash fragment)
 * This should be called when the page loads to check for OAuth redirect
 */
export const handleOAuthCallback = () => {
    const hash = window.location.hash;
    console.log('[OAuth Callback] Checking URL hash:', hash);

    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        console.log('[OAuth Callback] Found access token:', accessToken ? 'YES' : 'NO');
        console.log('[OAuth Callback] Expires in:', expiresIn);

        if (accessToken && expiresIn) {
            // Save to sessionStorage
            const expiry = Date.now() + parseInt(expiresIn) * 1000;
            sessionStorage.setItem('google_access_token', accessToken);
            sessionStorage.setItem('google_token_expiry', expiry.toString());

            console.log('[OAuth Callback] Token saved to sessionStorage');

            // Send message to parent window if this is a popup
            if (window.opener) {
                console.log('[OAuth Callback] Sending token to parent window...');
                window.opener.postMessage({
                    type: 'google_oauth_success',
                    accessToken: accessToken,
                    expiresIn: expiresIn
                }, window.location.origin);

                // Close popup after a short delay
                setTimeout(() => {
                    console.log('[OAuth Callback] Closing popup...');
                    window.close();
                }, 500);
            }
        }
    } else if (hash && hash.includes('error')) {
        // Handle OAuth error
        const params = new URLSearchParams(hash.substring(1));
        const error = params.get('error');
        console.error('[OAuth Callback] OAuth error:', error);

        if (window.opener) {
            window.opener.postMessage({
                type: 'google_oauth_error',
                error: error || 'Unknown OAuth error'
            }, window.location.origin);

            setTimeout(() => window.close(), 500);
        }
    }
};

interface SlideImage {
    src: string;
    name: string;
}

/**
 * Export slides to Google Slides
 */
export const exportToGoogleSlides = async (
    slides: SlideImage[],
    deckName: string = 'Deckr.ai Presentation',
    onProgress?: (message: string) => void
): Promise<string> => {
    try {
        onProgress?.('Authorizing with Google...');
        const accessToken = await getGoogleAccessToken();

        onProgress?.('Creating new presentation...');

        // Create a new presentation
        const createResponse = await fetch(`${GOOGLE_SLIDES_API}/presentations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: deckName,
            }),
        });

        if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(error.error?.message || 'Failed to create presentation');
        }

        const presentation = await createResponse.json();
        const presentationId = presentation.presentationId;

        // Delete the default blank slide first
        onProgress?.(`Preparing presentation...`);

        await fetch(
            `${GOOGLE_SLIDES_API}/presentations/${presentationId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [{
                        deleteObject: {
                            objectId: presentation.slides[0].objectId,
                        },
                    }],
                }),
            }
        );

        onProgress?.(`Adding ${slides.length} slides...`);

        // Add slides with images - process ONE at a time (not in batch)
        // Google Slides API doesn't work well with large batches
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideId = `slide_${i}`;

            onProgress?.(`Processing slide ${i + 1}/${slides.length}...`);

            // Step 1: Create the slide
            await fetch(
                `${GOOGLE_SLIDES_API}/presentations/${presentationId}:batchUpdate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requests: [{
                            createSlide: {
                                objectId: slideId,
                                slideLayoutReference: {
                                    predefinedLayout: 'BLANK',
                                },
                            },
                        }],
                    }),
                }
            );

            onProgress?.(`Uploading image for slide ${i + 1}/${slides.length}...`);

            // Step 2: Upload image to Drive and make it publicly readable
            let imageUrl = slide.src;

            if (slide.src.startsWith('data:')) {
                // Convert data URL to blob
                const response = await fetch(slide.src);
                const blob = await response.blob();

                // Upload to Google Drive with public sharing
                const formData = new FormData();
                formData.append('metadata', new Blob([JSON.stringify({
                    name: `${deckName}_slide_${i + 1}.png`,
                    mimeType: 'image/png',
                })], { type: 'application/json' }));
                formData.append('file', blob);

                const uploadResponse = await fetch(
                    `${GOOGLE_DRIVE_API}/files?uploadType=multipart`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: formData,
                    }
                );

                if (uploadResponse.ok) {
                    const uploadedFile = await uploadResponse.json();
                    const fileId = uploadedFile.id;

                    // No need to make public - both the image and presentation are in the same Google account
                    // Google Slides can access the image because it's owned by the same user
                    imageUrl = `https://drive.google.com/uc?id=${fileId}`;
                    console.log(`[Google Slides] Uploaded image to Drive: ${imageUrl}`);
                } else {
                    const error = await uploadResponse.json();
                    console.error('[Google Slides] Drive upload failed:', error);
                    throw new Error(`Failed to upload image ${i + 1} to Google Drive`);
                }
            }

            // Step 3: Add image to slide with proper sizing (10" x 5.625" in EMUs)
            // 1 inch = 914400 EMUs
            // Standard slide: 10" width x 5.625" height
            const slideWidth = 9144000; // 10 inches in EMUs
            const slideHeight = 5143500; // 5.625 inches in EMUs

            onProgress?.(`Adding image to slide ${i + 1}/${slides.length}...`);

            const addImageResponse = await fetch(
                `${GOOGLE_SLIDES_API}/presentations/${presentationId}:batchUpdate`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requests: [{
                            createImage: {
                                url: imageUrl,
                                elementProperties: {
                                    pageObjectId: slideId,
                                    size: {
                                        width: { magnitude: slideWidth, unit: 'EMU' },
                                        height: { magnitude: slideHeight, unit: 'EMU' },
                                    },
                                    transform: {
                                        scaleX: 1,
                                        scaleY: 1,
                                        translateX: 0,
                                        translateY: 0,
                                        unit: 'EMU',
                                    },
                                },
                            },
                        }],
                    }),
                }
            );

            if (!addImageResponse.ok) {
                const error = await addImageResponse.json();
                console.error(`[Google Slides] Failed to add image to slide ${i + 1}:`, error);
                throw new Error(error.error?.message || `Failed to add image to slide ${i + 1}`);
            }

            console.log(`[Google Slides] Successfully added slide ${i + 1}/${slides.length}`);
        }

        onProgress?.('✅ Export complete!');

        // Return the presentation URL
        return `https://docs.google.com/presentation/d/${presentationId}/edit`;

    } catch (error: any) {
        console.error('Google Slides export error:', error);
        throw new Error(error.message || 'Failed to export to Google Slides');
    }
};
