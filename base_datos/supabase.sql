-- Tabla productos (Supabase)
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    artista TEXT NOT NULL,
    album TEXT NOT NULL,
    formato TEXT NOT NULL CHECK (formato IN ('Vinilo', 'CD')),
    precio NUMERIC(8,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    imagen TEXT,
    descripcion TEXT
);

-- Seguridad (RLS)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
DROP POLICY IF EXISTS "Lectura publica de productos" ON productos;
CREATE POLICY "Lectura publica de productos" ON productos
    FOR SELECT USING (true);

-- Productos iniciales
INSERT INTO productos (artista, album, formato, precio, stock, imagen, descripcion)
SELECT * FROM (VALUES
    ('Sade', 'Love Deluxe', 'Vinilo', 38.00, 8, 'imagenes/disco-01.jpg', 'Soul elegante y sensual de los noventa.'),
    ('Billie Eilish', 'Hit Me Hard and Soft', 'Vinilo', 40.00, 15, 'imagenes/disco-02.jpg', 'Pop alternativo íntimo y atmosférico.'),
    ('Pink Floyd', 'The Dark Side of the Moon', 'Vinilo', 45.00, 10, 'imagenes/disco-03.jpg', 'Obra maestra del rock progresivo.'),
    ('The Beatles', 'Abbey Road', 'Vinilo', 42.00, 12, 'imagenes/disco-04.jpg', 'El último gran clásico grabado por la banda.'),
    ('Fleetwood Mac', 'Rumours', 'Vinilo', 36.00, 9, 'imagenes/disco-05.jpg', 'Rock suave lleno de himnos inolvidables.'),
    ('Daft Punk', 'Random Access Memories', 'Vinilo', 48.00, 7, 'imagenes/disco-06.jpg', 'Electrónica con alma disco y funk.'),
    ('Nirvana', 'Nevermind', 'Vinilo', 35.00, 14, 'imagenes/disco-07.jpg', 'El disco que definió el grunge.'),
    ('Taylor Swift', '1989 (Taylor''s Version)', 'Vinilo', 44.00, 20, 'imagenes/disco-08.jpg', 'Pop brillante regrabado por su autora.'),
    ('Soda Stereo', 'Canción Animal', 'Vinilo', 39.00, 6, 'imagenes/disco-09.jpg', 'Joya del rock latinoamericano.'),
    ('Amy Winehouse', 'Back to Black', 'Vinilo', 37.00, 11, 'imagenes/disco-10.jpg', 'Soul moderno con voz inconfundible.'),
    ('Sabrina Carpenter', 'Short n'' Sweet', 'CD', 18.00, 18, 'imagenes/disco-11.jpg', 'Pop fresco, divertido y pegajoso.'),
    ('Britney Spears', 'Oops!... I Did It Again', 'CD', 19.00, 10, 'imagenes/disco-12.jpg', 'Ícono del pop de los dos mil.'),
    ('Michael Jackson', 'Bad', 'CD', 16.00, 13, 'imagenes/disco-13.jpg', 'Éxitos bailables del rey del pop.'),
    ('Queen', 'A Night at the Opera', 'CD', 17.00, 9, 'imagenes/disco-14.jpg', 'Rock teatral con Bohemian Rhapsody.'),
    ('Shakira', 'Pies Descalzos', 'CD', 15.00, 12, 'imagenes/disco-15.jpg', 'El debut internacional de Shakira.'),
    ('Bad Bunny', 'Un Verano Sin Ti', 'CD', 20.00, 16, 'imagenes/disco-16.jpg', 'Ritmos caribeños para todo el verano.'),
    ('Adele', '21', 'CD', 16.00, 14, 'imagenes/disco-17.jpg', 'Baladas poderosas de desamor.'),
    ('Coldplay', 'Parachutes', 'CD', 15.00, 8, 'imagenes/disco-18.jpg', 'Rock melódico y nostálgico.'),
    ('The Weeknd', 'After Hours', 'CD', 19.00, 11, 'imagenes/disco-19.jpg', 'R&B oscuro con sonido ochentero.'),
    ('Juanes', 'Mi Sangre', 'CD', 14.00, 7, 'imagenes/disco-20.jpg', 'Pop rock colombiano lleno de éxitos.')
) AS nuevos (artista, album, formato, precio, stock, imagen, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM productos);
