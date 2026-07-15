import url from "./util/url.js";

export default {
	evento: "",
	titulo: "Juego",
	inicio: "espera",

	url,

	set pantalla(pantalla) {
		this.url.navegar(pantalla);
	},

	get pantalla() {
		return this.url.id;
	},

	init() {
		this.url.interpretar(location);

		if(this.pagina == "#"){
			this.pantalla = "inicio";
		}
	},

	mostrar(pantalla) {
		this.pantalla = pantalla;
	}
};
