import { PinterestBoard, PinPostPayload, VideoPinPostPayload } from '../types';

const PINTEREST_API_URL = 'https://api.pinterest.com/v5';

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        console.error("Pinterest API Error:", errorData);
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}


export async function fetchBoards(token: string): Promise<PinterestBoard[]> {
    try {
        const response = await fetch(`${PINTEREST_API_URL}/boards`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await handleApiResponse(response);
        return data.items as PinterestBoard[];
    } catch (error) {
        console.error("Error fetching Pinterest boards:", error);
        throw new Error("Could not fetch boards. Please check your Access Token and permissions.");
    }
}

export async function createPin(token: string, payload: PinPostPayload): Promise<void> {
    try {
        const response = await fetch(`${PINTEREST_API_URL}/pins`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        await handleApiResponse(response);
    } catch (error) {
        console.error("Error creating Pinterest pin:", error);
        throw new Error("Could not post pin. The board may not exist or the image may be invalid.");
    }
}

export async function createVideoPin(
    token: string, 
    details: { board_id: string; title: string; description: string; }, 
    videoFile: File,
    onProgress?: (message: string) => void
): Promise<void> {
    try {
        // Step 1: Register the video upload
        onProgress?.('Registering video upload...');
        const registerResponse = await fetch(`${PINTEREST_API_URL}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ media_type: 'video' })
        });
        const registerData = await handleApiResponse(registerResponse);
        const { media_id, upload_url, upload_parameters } = registerData;

        // Step 2: Upload the video file to the provided URL
        onProgress?.('Uploading video file...');
        const formData = new FormData();
        Object.entries(upload_parameters).forEach(([key, value]) => {
            formData.append(key, value as string);
        });
        formData.append('file', videoFile);

        const uploadResponse = await fetch(upload_url, {
            method: 'POST',
            body: formData,
        });

        if (uploadResponse.status !== 204) {
            console.error("Video file upload failed", await uploadResponse.text());
            throw new Error(`Failed to upload video file. Status: ${uploadResponse.status}`);
        }

        // Step 3: Wait for video to process. In production, poll the /media/{media_id} endpoint.
        onProgress?.('Processing video... this can take a moment.');
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Step 4: Create the pin with the media_id
        onProgress?.('Finalizing Pin...');
        const pinPayload: VideoPinPostPayload = {
            ...details,
            media_source: {
                source_type: 'video_id',
                media_id: media_id,
            }
        };

        const createPinResponse = await fetch(`${PINTEREST_API_URL}/pins`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pinPayload)
        });
        
        await handleApiResponse(createPinResponse);

    } catch (error) {
        console.error("Error creating Pinterest video pin:", error);
        throw new Error("Could not post video pin. Check permissions and ensure the video format is supported by Pinterest.");
    }
}