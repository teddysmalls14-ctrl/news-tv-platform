# BC News Ent TV - Guia rapida

## 1. Base de datos
- Crea un proyecto gratis en https://supabase.com o https://neon.tech
- Copia la connection string y pegala en backend/.env como DATABASE_URL
- Ejecuta backend/schema.sql en el SQL editor

## 2. Cloudflare R2
- Entra a https://dash.cloudflare.com -> R2 -> Create bucket
- Genera un API token con lectura/escritura solo para ese bucket
- Activa el dominio publico r2.dev para el bucket
- Pega endpoint, keys, bucket y URL publica en backend/.env

## 3. Pixabay musica
- Registrate gratis en https://pixabay.com/api/docs
- Copia tu API key en backend/.env como PIXABAY_KEY

## 4. Backend
- cd backend
- python -m venv venv && source venv/bin/activate
- pip install -r requirements.txt
- cp .env.example .env
- flask run

## 5. Frontend
- cd frontend
- npm install
- cp .env.local.example .env.local
- npm run dev

## 6. Marca de agua
- La quema FFmpeg con drawtext en backend/app.py
- Cambia WATERMARK_TEXT en .env
- En Linux el font path es /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
- En Windows cambia esa ruta al font instalado

## 7. Monetizar
- Con contenido, aplica a Google AdSense
- Ezoic plan gratis para sitios pequenos
- Carbon Ads para nicho tecnico

## Despliegue gratis
- Frontend: Netlify Drop
- Backend: Render.com o Railway gratis
