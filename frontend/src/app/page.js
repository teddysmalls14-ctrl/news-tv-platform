import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function AdSlot({ slot }) {
  return (
    <div
      style={{
        border: "1px dashed #bbb",
        borderRadius: 8,
        padding: "10px 12px",
        margin: "14px 0",
        background: "#fafafa",
        fontSize: 12,
        color: "#777",
        textAlign: "center",
      }}
      data-ad-slot={slot}
    >
      Anuncio {slot}
      <div
        style={{
          marginTop: 6,
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0f0f0",
          borderRadius: 6,
        }}
      >
        espacio para AdSense / Ezoic
      </div>
    </div>
  );
}

function FeedItem({ item, index }) {
  return (
    <>
      {index > 0 && index % 3 === 0 && <AdSlot slot={Math.floor(index / 3)} />}
      <article
        style={{
          borderBottom: "1px solid #eee",
          padding: "16px 0",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#0a6cff",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {item.fuente}
          </span>
          <span style={{ fontSize: 11, color: "#999" }}>{item.provincia}</span>
        </div>
        <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>{item.titulo}</h3>
        {item.resumen && (
          <p style={{ margin: "0 0 8px", color: "#444", lineHeight: 1.5 }}>
            {item.resumen}
          </p>
        )}
        <a
          href={item.enlace_original}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: "#0a6cff" }
        >
          Leer en {item.fuente} →
        </a>
      </article>
    </>
  );
}

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [rssItems, setRssItems] = useState([]);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [activeFeed, setActiveFeed] = useState("todos");
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
    fetch(`${API}/api/rss-feeds`).then((r) => r.json()).then((d) => {
      setRssItems(d.items || []);
      setRssFeeds(d.feeds || []);
    });
  }, []);

  const filteredRss = activeFeed === "todos"
    ? rssItems
    : rssItems.filter((i) => i.fuente_id === activeFeed);

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

      <section style={{ marginBottom: 40 }}>
        <h2>Noticias de República Dominicana</h2>
        <p style={{ fontSize: 13, color: "#666", marginTop: -8 }}>
          Resúmenes propios con enlace a la fuente. Sin pop-ups ni redirecciones.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setActiveFeed("todos")}
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              border: activeFeed === "todos" ? "1px solid #0a6cff" : "1px solid #ccc",
              background: activeFeed === "todos" ? "#e8f1ff" : "#fff",
              cursor: "pointer",
              fontSize: 13,
            }
          >
            Todos
          </button>
          {rssFeeds.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFeed(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 16,
                border: activeFeed === f.id ? "1px solid #0a6cff" : "1px solid #ccc",
                background: activeFeed === f.id ? "#e8f1ff" : "#fff",
                cursor: "pointer",
                fontSize: 13,
              }
            >
              {f.name}
            </button>
          ))}
        </div>
        {filteredRss.length === 0 && <p>Cargando feeds...</p>}
        {filteredRss.map((item, idx) => (
          <FeedItem key={item.enlace_original + idx} item={item} index={idx} />
        ))}
        {filteredRss.length > 0 && <AdSlot slot="final" />}
      </section>

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

      <h2>Ultimas noticias propias</h2>
      {noticias.map((n) => (
        <article key={n.id} style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}>
          {n.url_imagen && <img src={n.url_imagen} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />}
          <h3>{n.titulo}</h3>
          <div dangerouslySetInnerHTML={{ __html: n.cuerpo }} />
          {n.url_video && (
            <video src={n.url_video} controls style={{ width: "100%", marginTop: 8 }} />
          )}
          {n.url_audio && <audio src={n.url_audio} controls style={{ width: "100%" }} />}
          <small>{n.fecha_publicacion}</small>
        </article>
      ))}
    </main>
  );
}
