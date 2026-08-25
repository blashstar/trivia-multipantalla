/**
 * Escalado 16:9 — ajusta #aplicacion al viewport del cliente.
 * Mantiene aspect ratio 1920×1080 y centra el contenedor.
 *
 * @param {number} [ancho=1920] - Ancho de diseño base
 * @param {number} [alto=1080]  - Alto de diseño base
 */
export function iniciarEscalado(ancho = 1920, alto = 1080) {
    function escalar() {
        const app = document.getElementById('aplicacion');
        if (!app) return;
        const escala = Math.min(window.innerWidth / ancho, window.innerHeight / alto);
        const x = (window.innerWidth - ancho * escala) / 2;
        const y = (window.innerHeight - alto * escala) / 2;
        app.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + escala + ')';
    }

    window.addEventListener('resize', escalar);
    window.addEventListener('DOMContentLoaded', escalar);
    escalar();
}
