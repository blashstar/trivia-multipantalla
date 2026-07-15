import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-analytics.js";
import { getDatabase, ref, child, set, get, push, onValue, query, orderByChild } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.9.1/firebase-database.js";
import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";


let app = null;
let analytics = null;
let db = null;
let evento = null;

export default {
	config: {
		apiKey: "",
		authDomain: "",
		databaseURL: "",
		projectId: "",
		storageBucket: "",
		messagingSenderId: "",
		appId: "",
		measurementId: "",
		evento: 'demo'
	},

	activo: false,

	async configurar(opciones = {}, plantilla = null) {
		// Prioridad de configuración: variables de entorno > opciones recibidas > valores por defecto
		const envConfig = (typeof window !== 'undefined' && window.ENV_FIREBASE_CONFIG) ? window.ENV_FIREBASE_CONFIG : {};
		Object.assign(this.config, envConfig, opciones);

		if (!this.config.apiKey || !this.config.databaseURL || !this.config.projectId) {
			console.error('Faltan credenciales de Firebase. Asegúrate de que env.js se haya generado correctamente a partir de las variables de entorno.');
			return;
		}

		app = initializeApp(this.config);
		analytics = getAnalytics(app);
		db = ref(getDatabase(app), this.config.evento);

		evento = ref(getDatabase(app), this.config.evento);
		this.evento = (await get(evento)).val();


		if(this.evento == null && plantilla != null){
			console.log("evento: " + plantilla);
			await set(evento, plantilla);
		}

		// this.conectar("pagina", "juego/pagina");
		// this.conectar("pregunta", "juego/pregunta");
		// this.conectar("jugadores", "juego/jugadores");

		this.activo = true;
	},

	vigilar(clave, callback){
		return onValue(child(evento, clave), callback);
	},

	conectar(clave, objeto, propiedad) {
		return onValue(child(evento, clave), (snapshot) => {
			objeto[propiedad] = snapshot.val();
		});
	},

	async actualizar(clave, valor) {
		await set(child(evento, clave), valor);
	},

	async nodo(clave){
		return await get(child(evento, clave));
	},

	async obtener(clave){
		return (await this.nodo(clave)).val();
	},

	async lista(clave){
		return Object.values(await this.obtener(clave));
	},

	async agregar(clave, objeto, number = false){
		const lista = await get(child(evento, clave));
		let id = 0;
		if(lista !== null){
			id = lista.size;
		}

		let item = null;

		if(number){
			item = child(evento, `${clave}/${id}`);
		}
		else{
			if(!objeto.hasOwnProperty("id")){
				objeto["id"] = id;
			}
			item = push(child(evento, clave));
		}

		await set(item, objeto);

		return await get(item);
	}

};
