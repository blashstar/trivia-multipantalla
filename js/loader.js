/**
 * Carga configuración centralizada (config.json + brand.json + archivos extra).
 * Fusiona todo en window.opcionesJuego.
 *
 * @param {Object} [extra] - Pares clave/valor adicionales (ej: { preguntas: [...] })
 * @returns {Promise<Object>} configuración fusionada
 */
export async function cargarConfig(extra = {}) {
    try {
        const [configResp, brandResp] = await Promise.all([
            fetch('./config.json', { cache: 'no-store' }).then(r => r.json()),
            fetch('./brand.json', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
        ]);

        window.opcionesJuego = {
            ...window.opcionesJuego,
            ...configResp,
            ...brandResp,
            ...extra
        };

        // Compatibilidad: mapear jugadores.maximo a maximoJugadores
        if(brandResp?.jugadores?.maximo){
            window.opcionesJuego.maximoJugadores = brandResp.jugadores.maximo;
        }
    } catch (error) {
        console.error('No se pudo cargar la configuración:', error);
    }

    return window.opcionesJuego;
}
