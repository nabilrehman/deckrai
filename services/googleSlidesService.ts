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

    const popup = window.open(
        authUrl,
        'Google Slides Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
    );

    // Wait for OAuth callback
    return new Promise((resolve, reject) => {
        const checkPopup = setInterval(() => {
            if (popup?.closed) {
                clearInterval(checkPopup);

                const token = sessionStorage.getItem('google_access_token');
                if (token) {
                    resolve(token);
                } else {
                    reject(new Error('OAuth authorization was cancelled'));
                }
            }
        }, 500);

        // Timeout after 2 minutes
        setTimeout(() => {
            clearInterval(checkPopup);
            popup?.close();
            reject(new Error('OAuth authorization timed out'));
        }, 120000);
    });
};

/**
 * Handle OAuth callback (parse hash fragment)
 */
export const handleOAuthCallback = () => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken && expiresIn) {
            const expiry = Date.now() + parseInt(expiresIn) * 1000;
            sessionStorage.setItem('google_access_token', accessToken);
            sessionStorage.setItem('google_token_expiry', expiry.toString());

            // Close popup if this is a popup window
            if (window.opener) {
                window.close();
            }
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

        onProgress?.(`Adding ${slides.length} slides...`);

        // Delete the default blank slide
        const requests: any[] = [{
            deleteObject: {
                objectId: presentation.slides[0].objectId,
            },
        }];

        // Add slides with images
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideId = `slide_${i}`;

            onProgress?.(`Uploading slide ${i + 1}/${slides.length}...`);

            // Create a new slide
            requests.push({
                createSlide: {
                    objectId: slideId,
                    slideLayoutReference: {
                        predefinedLayout: 'BLANK',
                    },
                },
            });

            // Upload image to Drive first (if it's a data URL)
            let imageUrl = slide.src;

            if (slide.src.startsWith('data:')) {
                // Convert data URL to blob
                const response = await fetch(slide.src);
                const blob = await response.blob();

                // Upload to Google Drive
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
                    imageUrl = `https://drive.google.com/uc?id=${uploadedFile.id}`;
                }
            }

            // Add image to slide
            requests.push({
                createImage: {
                    url: imageUrl,
                    elementProperties: {
                        pageObjectId: slideId,
                        size: {
                            width: { magnitude: 720, unit: 'EMU' },
                            height: { magnitude: 405, unit: 'EMU' },
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
            });
        }

        // Execute all requests in batch
        onProgress?.('Finalizing presentation...');

        const batchResponse = await fetch(
            `${GOOGLE_SLIDES_API}/presentations/${presentationId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requests }),
            }
        );

        if (!batchResponse.ok) {
            const error = await batchResponse.json();
            throw new Error(error.error?.message || 'Failed to update presentation');
        }

        onProgress?.('✅ Export complete!');

        // Return the presentation URL
        return `https://docs.google.com/presentation/d/${presentationId}/edit`;

    } catch (error: any) {
        console.error('Google Slides export error:', error);
        throw new Error(error.message || 'Failed to export to Google Slides');
    }
};
