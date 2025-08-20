import { useState, useEffect } from 'react';

interface ScheduleFormProps {
  selectedBoardId: string;
}

export default function ScheduleForm({ selectedBoardId }: ScheduleFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [boardId, setBoardId] = useState(selectedBoardId);
  const [mediaUrl, setMediaUrl] = useState('');
  const [when, setWhen] = useState('');

  useEffect(() => {
    if (selectedBoardId) setBoardId(selectedBoardId);
  }, [selectedBoardId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          link,
          board_id: boardId,
          media_url: mediaUrl,
          scheduled_at: when,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed: ${res.status} ${text}`);
        return;
      }
      alert('Scheduled!');
    } catch (err: any) {
      alert(`Error: ${err?.message ?? err}`);
    }
  }

  return (
    <form onSubmit={submit} className="pp-grid" style={{ maxWidth: 680 }}>
      <input className="pp-input" placeholder="Board ID" value={boardId} readOnly />
      <input className="pp-input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="pp-input" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input className="pp-input" placeholder="Destination Link (optional)" value={link} onChange={e=>setLink(e.target.value)} />
      <input className="pp-input" placeholder="Image URL" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} />
      <input className="pp-input" type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
      <button className="pp-btn primary" type="submit">Schedule Pin</button>
    </form>
  );
}