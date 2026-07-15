import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";

export function normalizarRuta(ruta = '#/') {
	return _.trim(ruta, '#/');
}

export function formatearRuta(ruta) {
	ruta = normalizarRuta(ruta);

	if(!_.startsWith(ruta, '/') && !_.startsWith(ruta, '!')){
		ruta = `/${ruta}`;
	}

	return `#${ruta}`;
}

export function analizarRuta(ruta) {
	ruta = normalizarRuta(ruta);



	return `#${ruta}`;
}
