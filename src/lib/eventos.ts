export interface Participante {
  vina: string;
  nombre: string;
  cargo: string;
  foto: string;
  instagram: string;
  web?: string;
}

export interface InstagramContacto {
  handle: string;
  url: string;
}

export interface FotoLugar {
  archivo: string;
  alt: string;
}

export interface EventoData {
  slug: string;
  destacado: boolean;
  publicado: boolean;
  titulo: string;
  serie: string;
  presenta: string;
  bajada: string;
  descripcion: string;
  fecha: {
    inicio: string;
    fin: string;
    textoVisible: string;
  };
  lugar: {
    nombre: string;
    detalle: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    urlMapa: string;
    fotos?: FotoLugar[];
    logo?: string;
  };
  precio: {
    monto: number | null;
    moneda: string;
    textoVisible: string;
    incluye: string[];
  };
  pago: {
    proveedor: string;
    estado: 'proximamente' | 'activo' | 'agotado' | 'cerrado' | string;
    urlLink: string;
    textoBoton: string;
    _estados?: string[];
  };
  restricciones: string[];
  participantes: Participante[];
  contacto: {
    email: string;
    instagram: InstagramContacto[];
  };
  imagenes: {
    hero: string;
    og: string;
  };
}

/**
 * Carga todos los eventos de src/data/eventos/*.json ordenados por nombre de archivo usando comparación binaria explícita.
 */
export function getEventos(): EventoData[] {
  const modules = import.meta.glob<{ default: EventoData }>('/src/data/eventos/*.json', { eager: true });
  const keys = Object.keys(modules);

  // Orden binario estricto independiente del locale del sistema
  keys.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return keys.map((key) => {
    const mod = modules[key];
    return (mod as { default: EventoData }).default || (mod as unknown as EventoData);
  });
}

/**
 * Obtiene solo los eventos que tienen publicado: true.
 */
export function getEventosPublicados(): EventoData[] {
  return getEventos().filter((evento) => evento.publicado === true);
}

/**
 * Obtiene el evento destacado entre los publicados.
 * - Cero eventos destacados retorna null (estado válido).
 * - Más de un evento destacado lanza un error claro.
 */
export function getEventoDestacado(): EventoData | null {
  const publicados = getEventosPublicados();
  const destacados = publicados.filter((evento) => evento.destacado === true);

  if (destacados.length > 1) {
    const slugs = destacados.map((e) => `"${e.slug}"`).join(', ');
    throw new Error(
      `Error de configuración de datos: Hay más de un evento publicado marcado como destacado (${slugs}). Solo un evento puede tener "destacado": true a la vez.`
    );
  }

  if (destacados.length === 1) {
    return destacados[0];
  }

  return null;
}
