import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [musicQuery, setMusicQuery] = useState("news");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const editor = useEditor({ extensions: [StarterKit], content: "<p>Escribe la noticia...</p>" });

  useEffect(() => {
    fetch(`${API}/api/noticias`).then((r) => r.json()).then((d) => setNoticias(d.noticias || []));
  }, []);

  async function buscarMusica() {
    const r = await fetch(`${API}/api/pixabay-music?q=${encodeURIComponent(musicQuery)}`, { mode: "cors" });
    const d = await r.json();
    setTracks(d.hits || []);
  }

  async function publicar(e) {
    e.preventDefault();
    if (!video) return setMsg("Selecciona un video");
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("video", video);
    fd.append("title", title);
    fd.append("body", editor?.getHTML() || "");
    fd.append("image_url", imageUrl);
    fd.append("audio_url", audioUrl);
    const r = await fetch(`${API}/api/upload-video`, { method: "POST", body: fd });
    const d = await r.json();
    setLoading(false);
    if (d.error) setMsg(d.error);
    else {
      setMsg("Publicado: " + d.video_url);
      setTitle("");
      setVideo(null);
      fetch(`${API}/api/noticias`).then((r) => r.json()).then((d) => setNoticias(d.noticias || []));
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>BC News Ent TV</h1>
      <form onSubmit={publicar} style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, marginBottom: 32 }}>
        <h2>Nueva noticia</h2>
        <input placeholder="Titulo" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <div style={{ border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, minHeight: 120 }}>
          <EditorContent editor={editor} />
        </div>
        <input type="file" onChange={(e) => setVideo(e.target.files[0])} style={{ marginBottom: 8 }} />
        <input placeholder="URL de imagen (Cloudinary/Unsplash)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input placeholder="Buscar musica Pixabay" value={musicQuery} onChange={(e) => setMusicQuery(e.target.value)} style={{ flex: 1 }} />
          <button type="button" onClick={buscarMusica}>Buscar</button>
        </div>
        {tracks.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span>{t.tags}</span>
            <button type="button" onClick={() => setAudioUrl(t.audio)}>+ usar</button>
          </div>
        ))}
        {audioUrl && <p>Audio: {audioUrl}</p>}
        <button type="submit" disabled={loading}>{loading ? "Subiendo..." : "Publicar"}</button>
        {msg && <p>{msg}</p>}
      </form>
      <h2>Ultimas noticias</h2>
      {noticias.map((n) => (
        <article key={n.id} style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}>
          {n.url_imagen && <img src={n.url_imagen} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />}
          <h3>{n.titulo}</h3>
          <div dangerouslySetInnerHTML={{ __html: n.cuerpo }} />
          {n.url_video && (
            <video src={n.url_video} fontSize={12} controls style={{ width: "100%", marginTop: 8 }} />
          )}
          {n.url_audio && <audio src={n.url_audio} controls style={{ width: "100%" }} />}
          <small>{n.fecha_publicacion}</small>
        </article>
      ))}
    </main>
  );
}
