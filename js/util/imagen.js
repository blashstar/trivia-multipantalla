export const gif1px = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const valoresInvalidos = ['false', 'null', 'undefined', ''];

export function urlImagen(valor) {
	if (typeof valor !== 'string') {
		return gif1px;
	}

	const limpio = valor.trim();

	if (limpio.length === 0) {
		return gif1px;
	}

	if (valoresInvalidos.includes(limpio.toLowerCase())) {
		return gif1px;
	}

	return limpio;
}
