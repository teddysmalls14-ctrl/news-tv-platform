import os
import subprocess
import uuid
from datetime import datetime

import boto3
from botocore.config import Config
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
import psycopg2

app = Flask(__name__)
CORS(app)

R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
WATERMARK_TEXT = os.getenv("WATERMARK_TEXT", "BC News Ent TV")

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)


def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


@app.route("/api/health", methods=["GET"])
def health():
    return {"status": "ok"}


@app.route("/api/upload-video", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return {"error": "no video file"}, 400

    file = request.files["video"]
    title = request.form.get("title", "")
    body = request.form.get("body", "")
    image_url = request.form.get("image_url", "")
    audio_url = request.form.get("audio_url", "")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "mp4"
    filename = f"{uuid.uuid4()}.{ext}"
    tmp_in = f"/tmp/{filename}"
    tmp_out = f"/tmp/wm_{filename}"
    file.save(tmp_in)

    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    vf = (
        f"drawtext=fontfile='{font_path}':text='{WATERMARK_TEXT}':"
        f"fontcolor=white@0.7:fontsize=28:x=10:y=H-th-10,"
        f"scale=-2:720"
    )
    cmd = [
        "ffmpeg", "-y", "-i", tmp_in,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy", tmp_out,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        return {"error": "ffmpeg failed", "detail": e.stderr.decode()[:500]}, 500

    key = f"videos/{filename}"
    with open(tmp_out, "rb") as f:
        s3.upload_fileobj(f, R2_BUCKET, key, ExtraArgs={"ContentType": f"video/{ext}"})

    video_url = f"{R2_PUBLIC_URL}/{key}"

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO noticias (titulo, cuerpo, url_imagen, url_video, url_audio, estado)
           VALUES (%s, %s, %s, %s, %s, 'publicado')
           RETURNING id, fecha_publicacion""",
        (title, body, image_url, video_url, audio_url),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    for p in (tmp_in, tmp_out):
        if os.path.exists(p):
            os.remove(p)

    return {"id": row["id"], "video_url": video_url, "fecha": str(row["fecha_publicacion"])}


@app.route("/api/noticias", methods=["GET"])
def list_noticias():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, titulo, cuerpo, url_imagen, url_video, url_audio, fecha_publicacion "
        "FROM noticias WHERE estado='publicado' ORDER BY fecha_publicacion DESC LIMIT 50"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"noticias": [dict(r) for r in rows]}


@app.route("/api/pixabay-music", methods=["GET"])
def pixabay_music():
    import requests
    q = request.args.get("q", "news")
    key = os.getenv("PIXABAY_KEY")
    r = requests.get(
        "https://pixabay.com/api/music/",
        params={"key": key, "q": q, "per_page": 10},
        timeout=20,
    )
    return r.json()


if __name__ == "__main__":
    app.run(port=5000, debug=True)
