import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";

export default {
	servidor: "localhost",
	puerto: "",
	consulta: "",
	raiz: "/",
	_segmentos: [],

	get ruta() {
		return this._segmentos.join("/");
	},

	set ruta(ruta) {
		this._segmentos = this.normalizar(ruta)
			.split("/")
			.filter((item) => item !== "");
	},

	get id() {
		let id = "";

		if (this._segmentos.length == 0) {
			id = "#";
		} else {
			id = `${this._segmentos.join(":")}`;
			id = _.replace(id, "!", "$")
		}

		return id;
	},

	get origen() {
		return `${this.servidor}${this.puerto == "" ? "" : `:${this.puerto}`}${
			this.raiz
		}${this.consulta}`;
	},

	resolver(ruta) {
		return `${this.origen}${this.formatear(ruta)}`;
	},

	normalizar(ruta = "#/") {
		let $ruta = _.toLower(ruta);
		$ruta = _.replace($ruta, /:/gm, '/');
		$ruta = _.replace($ruta, "$", "!");
		$ruta = _.trim($ruta, "#/");

		return $ruta;
	},

	formatear(ruta) {
		ruta = this.normalizar(ruta);

		if (!_.startsWith(ruta, "/") && !_.startsWith(ruta, "!")) {
			ruta = `/${ruta}`;
		}

		return `#${ruta}`;
	},

	interpretar(ubicacion) {
		this.servidor = ubicacion.origin;
		this.raiz = ubicacion.pathname;
		this.puerto = ubicacion.port;
		this.consulta = ubicacion.search;
		this.ruta = this.normalizar(ubicacion.hash);
	},

	navegar(ruta){
		this.ruta = ruta;
		location.hash = this.formatear(this.ruta);
	},
};
