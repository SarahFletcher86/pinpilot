export interface PinData {
  title: string;
  description: string;
  tags: string[];
  board: string;
}

export interface PinterestBoard {
    id: string;
    name: string;
}

export interface PinPostPayload {
    board_id: string;
    title: string;
    description: string;
    media_source: {
        source_type: 'image_base64';
        content_type: 'image/jpeg' | 'image/png';
        data: string;
    }
}

export interface VideoPinPostPayload {
    board_id: string;
    title: string;
    description: string;
    media_source: {
        source_type: 'video_id';
        media_id: string;
    }
}

export type Template = 'standard' | 'text-overlay' | 'bottom-bar';