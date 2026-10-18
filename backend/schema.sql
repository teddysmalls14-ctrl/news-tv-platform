CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) DEFAULT 'editor' CHECK (rol IN ('admin','editor')),
    creado_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT,
    url_imagen TEXT,
    url_video TEXT,
    url_audio TEXT,
    estado VARCHAR(20) DEFAULT 'publicado' CHECK (estado IN ('borrador','publicado')),
    fecha_publicacion TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    autor_id INTEGER REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias (fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_estado ON noticias (estado);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_noticias_updated ON noticias;
CREATE TRIGGER trg_noticias_updated
BEFORE UPDATE ON noticias
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
