-- =====================================================
-- CREAR TABLA categoria_menu PARA GESTIONAR CATEGORÍAS
-- =====================================================
-- Ejecutar este código en el SQL Editor de Supabase
-- =====================================================

-- 1. CREAR TABLA categoria_menu
CREATE TABLE public.categoria_menu (
  id integer NOT NULL DEFAULT nextval('categoria_menu_id_seq'::regclass),
  nombre character varying NOT NULL,
  turno character varying NOT NULL CHECK (turno IN ('dia', 'noche')),
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categoria_menu_pkey PRIMARY KEY (id),
  CONSTRAINT categoria_menu_nombre_turno_unique UNIQUE (nombre, turno)
);

-- 2. CREAR SECUENCIA PARA IDs
CREATE SEQUENCE IF NOT EXISTS public.categoria_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 3. ESTABLECER OWNER DE LA SECUENCIA
ALTER SEQUENCE public.categoria_menu_id_seq OWNED BY public.categoria_menu.id;

-- 4. CREAR FUNCIÓN PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_categoria_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. CREAR TRIGGER PARA UPDATED_AT
CREATE TRIGGER trigger_categoria_menu_updated_at
    BEFORE UPDATE ON public.categoria_menu
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_categoria_menu_updated_at();

-- 6. HABILITAR RLS (Row Level Security)
ALTER TABLE public.categoria_menu ENABLE ROW LEVEL SECURITY;

-- 7. CREAR POLÍTICAS DE SEGURIDAD
-- Permitir lectura para todos los usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON public.categoria_menu
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción para usuarios autenticados
CREATE POLICY "Enable insert access for authenticated users" ON public.categoria_menu
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir actualización para usuarios autenticados
CREATE POLICY "Enable update access for authenticated users" ON public.categoria_menu
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir eliminación para usuarios autenticados
CREATE POLICY "Enable delete access for authenticated users" ON public.categoria_menu
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. CREAR ÍNDICES PARA MEJOR PERFORMANCE
CREATE INDEX idx_categoria_menu_turno ON public.categoria_menu(turno);
CREATE INDEX idx_categoria_menu_activo ON public.categoria_menu(activo);
CREATE INDEX idx_categoria_menu_nombre ON public.categoria_menu(nombre);

-- 9. MIGRAR CATEGORÍAS EXISTENTES DESDE PRODUCTOS
-- Migrar categorías de día
INSERT INTO public.categoria_menu (nombre, turno)
SELECT DISTINCT categoria as nombre, 'dia' as turno
FROM public.productos
WHERE categoria IS NOT NULL
  AND categoria != ''
  AND categoria NOT LIKE '_temp%'
ON CONFLICT (nombre, turno) DO NOTHING;

-- Migrar categorías de noche
INSERT INTO public.categoria_menu (nombre, turno)
SELECT DISTINCT categoria_noche as nombre, 'noche' as turno
FROM public.productos
WHERE categoria_noche IS NOT NULL
  AND categoria_noche != ''
  AND categoria_noche NOT LIKE '_temp%'
ON CONFLICT (nombre, turno) DO NOTHING;

-- 10. LIMPIAR PRODUCTOS TEMPORALES
DELETE FROM public.productos
WHERE nombre LIKE '_temp%' AND activo = false;

-- 11. VERIFICAR DATOS MIGRADOS
-- Ejecutar estas queries para verificar que todo esté correcto:
/*
-- Ver categorías migradas
SELECT * FROM public.categoria_menu ORDER BY turno, nombre;

-- Contar categorías por turno
SELECT turno, COUNT(*) as total
FROM public.categoria_menu
WHERE activo = true
GROUP BY turno;

-- Verificar que no quedan productos temporales
SELECT COUNT(*) as productos_temporales
FROM public.productos
WHERE nombre LIKE '_temp%';
*/