// api/schedule/index.ts
// Schedules a pin or posts immediately if scheduledAt is "now".

import { supabase } from "../_supabase.js";

type Body = {
  pinterestAccessToken: string;
  boardId: string;
  title: string;
  description: string;
  imageBase64: string; // data URL or "data:;base64,..." string
  scheduledAt: string; // ISO timestamp
  link?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Use POST" });
    return;
  }
  try {
    const body: Body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { pinterestAccessToken, boardId, title, description, imageBase64, scheduledAt, link } = body;

    if (!pinterestAccessToken || !boardId || !title || !imageBase64) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const when = new Date(scheduledAt);
    const now = new Date();
    const diffMin = (when.getTime() - now.getTime()) / 60000;

    if (isNaN(when.getTime())) {
      res.status(400).json({ message: "Invalid scheduledAt" });
      return;
    }

    if (diffMin <= 5) {
      // post now
      const payload = {
        board_id: boardId,
        title,
        description,
        link,
        media_source: {
          source_type: "image_base64",
          content_type: "image/jpeg",
          data: (imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64)
        }
      };

      const r = await fetch("https://api.pinterest.com/v5/pins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pinterestAccessToken}`
        },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) {
        res.status(400).json({ message: "Pinterest post failed", detail: j });
        return;
      }
      res.status(200).json({ message: "Posted now", pin: j });
      return;
    }

    // else: queue in Supabase (table: schedules)
    const { error } = await supabase.from("schedules").insert({
      board_id: boardId,
      title,
      description,
      link,
      media_url: null,
      image_base64: imageBase64,
      pinterest_access_token: pinterestAccessToken,
      scheduled_at: when.toISOString(),
      status: "queued"
    });
    if (error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(200).json({ message: `Pin scheduled for ${when.toLocaleString()}` });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Scheduling failed" });
  }
}