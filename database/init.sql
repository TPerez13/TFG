-- Opcional: trabajar en un esquema propio
-- CREATE SCHEMA IF NOT EXISTS muchavidas;
-- SET search_path TO muchavidas, public;

-- =========================
-- TABLA: USUARIO
-- =========================
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     SERIAL PRIMARY KEY,
  correo         TEXT        NOT NULL UNIQUE,
  nombre         TEXT        NOT NULL,
  hash_clave     TEXT        NOT NULL,
  preferencias   JSONB,
  f_creacion     TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO usuario (correo, nombre, hash_clave, preferencias)
VALUES (
  'ejemplo@muchasvidas.com',
  'usuario',
  '$2a$10$WkQx/Io0i9F04f929zQecOZ7PcaNWVVK2t78KhCtYAEauJ8jdxTtq',
  NULL
)
ON CONFLICT (correo) DO NOTHING;

-- =========================
-- TABLA: TIPO_HABITO (catálogo)
-- =========================
CREATE TABLE IF NOT EXISTS tipo_habito (
  id_tipo_habito SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL UNIQUE,
  descripcion    TEXT
);

INSERT INTO tipo_habito (nombre, descripcion) VALUES
('Hidratación','Registro de agua ingerida'),
('Nutrición','Comidas y nutrientes'),
('Ejercicio','Actividad física'),
('Sueño','Horas de descanso'),
('Meditación','Bienestar mental')
ON CONFLICT (nombre) DO NOTHING;

-- =========================
-- TABLA: REGISTRO_HABITO
-- =========================
CREATE TABLE IF NOT EXISTS registro_habito (
  id_registro_habito SERIAL PRIMARY KEY,
  id_usuario         INT  NOT NULL,
  id_tipo_habito     INT  NOT NULL,
  f_registro         TIMESTAMPTZ NOT NULL,
  valor              NUMERIC     NOT NULL,
  unidad             TEXT,
  notas              TEXT,
  CONSTRAINT fk_registro_usuario
    FOREIGN KEY (id_usuario)     REFERENCES usuario(id_usuario)         ON DELETE CASCADE,
  CONSTRAINT fk_registro_tipo
    FOREIGN KEY (id_tipo_habito) REFERENCES tipo_habito(id_tipo_habito)
);

-- Índices recomendados (consultas por usuario/fecha y por usuario/tipo/fecha)
CREATE INDEX IF NOT EXISTS idx_registro_user_fecha
  ON registro_habito (id_usuario, f_registro);

CREATE INDEX IF NOT EXISTS idx_registro_user_tipo_fecha
  ON registro_habito (id_usuario, id_tipo_habito, f_registro);

-- =========================
-- TABLA: LOGRO
-- =========================
CREATE TABLE IF NOT EXISTS logro (
  id_logro     SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL UNIQUE,
  descripcion  TEXT,
  criterio     JSONB,         -- o TEXT si prefieres
  puntos       INT  NOT NULL DEFAULT 0
);

-- =========================
-- TABLA: USUARIO_LOGRO
-- =========================
CREATE TABLE IF NOT EXISTS usuario_logro (
  id_usuario_logro SERIAL PRIMARY KEY,
  id_usuario       INT NOT NULL,
  id_logro         INT NOT NULL,
  f_obtencion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  puntos           INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_usuario_logro_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_usuario_logro_logro
    FOREIGN KEY (id_logro)   REFERENCES logro(id_logro),
  CONSTRAINT uq_usuario_logro UNIQUE (id_usuario, id_logro)
);

-- =========================
-- TABLA: RETO
-- =========================
CREATE TABLE IF NOT EXISTS reto (
  id_reto     SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  objetivo    JSONB,
  f_inicio    TIMESTAMPTZ,
  f_fin       TIMESTAMPTZ
);

-- =========================
-- TABLA: USUARIO_RETO
-- =========================
-- Nota: puedes convertir "estado" en ENUM nativo de PostgreSQL si lo deseas.
-- Aquí lo dejamos con CHECK para no depender de tipos globales.
CREATE TABLE IF NOT EXISTS usuario_reto (
  id_usuario_reto SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL,
  id_reto         INT NOT NULL,
  estado          TEXT NOT NULL CHECK (estado IN ('inscrito','en_curso','completado','cancelado')),
  progreso        NUMERIC NOT NULL DEFAULT 0,
  f_inscripcion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_usuario_reto_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_usuario_reto_reto
    FOREIGN KEY (id_reto)    REFERENCES reto(id_reto),
  CONSTRAINT uq_usuario_reto UNIQUE (id_usuario, id_reto)
);

-- =========================
-- TABLA: RECORDATORIO
-- =========================
CREATE TABLE IF NOT EXISTS recordatorio (
  id_recordatorio SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL,
  id_tipo_habito  INT NOT NULL,
  programacion    JSONB NOT NULL,           -- hora, frecuencia, días de semana, etc.
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  f_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_recordatorio_usuario
    FOREIGN KEY (id_usuario)     REFERENCES usuario(id_usuario)         ON DELETE CASCADE,
  CONSTRAINT fk_recordatorio_tipo
    FOREIGN KEY (id_tipo_habito) REFERENCES tipo_habito(id_tipo_habito)
);

-- =========================
-- TABLA: NOTIFICACION (histórico)
-- =========================
CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL,
  titulo          TEXT NOT NULL,
  cuerpo          TEXT NOT NULL,
  f_programada    TIMESTAMPTZ,
  f_envio         TIMESTAMPTZ,
  estado          TEXT NOT NULL CHECK (estado IN ('programada','enviada','fallida')),
  metadatos       JSONB,
  CONSTRAINT fk_notificacion_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- Índice útil para planificaciones/consultas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_notificacion_user_programada
  ON notificacion (id_usuario, f_programada);
