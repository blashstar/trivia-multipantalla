import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";
import firebase from '../util/firebase.js';
import url from '../util/url.js';
import {letra} from '../util/texto.js';
import { gif1px, urlImagen } from '../util/imagen.js';

export default {
	titulo: "Juego",
	evento: "demo",
	modulo: "mando",
	pagina : "#",

	maximoJugadores: 3,
	jugadores: 0,

	gif1px,
	imagenes: {
		fondo: gif1px,
		femenino: gif1px,
		masculino: gif1px,
	},

	sexos:{
		F: "femenino",
		M: "masculino",
	},

	jugador:null,
	sexo: '',
	nombre: '',
	etiqueta: '',
	puntaje: 0,
	pregunta: -null,
	respuesta: '',
	tiempo: 0,
	tiempoRestante: 45,
	tiempoRespuesta: 0,
	correcta: '',
	ganador: false,

	get restante() {
		return Math.ceil(this.tiempoRestante);
	},

	firebase,
	url,

	letra,

	get pagina(){
		return this.url.id;
	},

	imagen(clave){
		return urlImagen(this.imagenes?.[clave]);
	},

	async init(){
		Object.assign(this, window.opcionesJuego);
		this.firebase.configurar(opcionesJuego);
		this.url.interpretar(location);

		// this.navegar("final");
		// return;

		this.firebase.conectar("juego/pregunta", this, "pregunta");
		this.firebase.conectar("juego/respuesta", this, "correcta");
		this.firebase.conectar("juego/tiempo", this, "tiempo");
		this.firebase.conectar("juego/tiempoRestante", this, "tiempoRestante");
		// this.$watch(`pregunta`, pregunta => {
		// 	if(pregunta != null){
		// 		this.respuesta = null;
		// 		this.correcta = null;
		// 		this.tiempo = 0;
		// 		this.navegar("pregunta");
		// 	}
		// });



		if(this.jugador){
			this.conectar();
		}
		// else if(!this.registrable){
		// 	this.navegar("no");
		// }
		else{
			this.navegar("inicio");

			this.firebase.vigilar("jugadores", snapshot => {
				this.jugadores = snapshot.size;

				// if(this.jugadores == this.maximoJugadores && !this.jugador){
				// 	this.navegar("no");
				// }else if(!this.jugador){
				// 	this.navegar("inicio");
				// }

				if(!this.jugador){
					if(this.jugadores == this.maximoJugadores){
						this.navegar("no");
						// this.navegar("no");
						// setTimeout(() => this.navegar("no"), 1000);
					}else{
						if(this.pagina == "no"){
							this.navegar("inicio");
						}
					}
				}
			});

			// this.$watch("registrable", registrable => {
			// 	console.log("this.jugadores", this.jugadores);
			// 	console.log("registrable", registrable, this.jugador);
			// 	// if(!registrable && !this.jugador){
			// 	// 	console.log("no registrable");
			// 	// 	// this.$nextTick(() => this.navegar("no"));
			// 	// 	// this.navegar("no");
			// 	// 	setTimeout(() => this.navegar("no"), 1000);
			// 	// }

			// 	// else if(!this.jugador){
			// 	// 	this.navegar("inicio");
			// 	// }

			// 	if(!registrable){
			// 		this.navegar("no");
			// 		// if(!this.jugador){
			// 		// 	this.navegar("inicio");
			// 		// }
			// 	}

			// });

		}


	},

	navegar(pagina){
		if(this.jugador){
			this.firebase.actualizar(`jugadores/${this.jugador}/pagina`, pagina);
		}
		else{
			this.url.navegar(pagina);

		}
	},

	get registrable(){
		// return this.firebase.activo && this.firebase.lista("jugadores").length < this.jugadores;
		// return (!this.jugador) && this.firebase.activo && (this.jugadores < this.maximoJugadores);
		return this.firebase.activo && (this.jugadores < this.maximoJugadores);

	},

	async registrar(){
		console.log("registrar");

		if(this.registrable){
			this.jugador = this.jugadores;
			const item = await this.firebase.agregar("jugadores", {
				nombre: this.nombre,
				sexo: this.sexo,
				puntaje: 0,
				respuesta: "",
				tiempo: 0,
				// correcta: false,
				estado: "parado",
				pagina: "espera",
				gana: false
			}, true);

			this.jugador = item.key;
			this.etiqueta = letra(item.key);

			this.firebase.actualizar(`jugadores/${this.jugador}/etiqueta`,this.etiqueta);


			this.navegar("espera");

			this.conectar();


		}



		// await this.firebase.actualizar(`jugadores/${item.key}/puntaje`, 0);
	},

	conectar(){
		this.firebase.conectar(`jugadores/${this.jugador}/puntaje`, this, "puntaje");
		this.firebase.conectar(`jugadores/${this.jugador}/respuesta`, this, "respuesta");

		this.firebase.vigilar(`jugadores/${this.jugador}`, snapshot => {
				// console.log("snapshot", snapshot.exists());
			if(!snapshot.exists()){
				console.log("desconectado");
				this.jugador = null;
				this.sexo = '';
				this.nombre = '';
			}
		});


		this.firebase.vigilar(`juego/ganador`, snapshot => {
			if(snapshot.exists()){
				this.ganador = snapshot.val() == this.etiqueta;
			}
			else{
				this.ganador = false;
			}
		});


		this.firebase.vigilar(`jugadores/${this.jugador}/pagina`, snapshot => {
			let pagina = snapshot.val();
			console.log("pagina", pagina);
			// if(_.isNull(pagina)){
			// 	this.navegar('inicio');
			// }
			// else{
			// 	this.navegar(pagina);
			// }
			// console.log("pagina", pagina);

			switch(this.pagina){
				case "espera":
				case "pregunta":
				case "final":
					if(_.isNull(pagina)){
						pagina = 'final';
					}
				break;
			}

			switch(pagina){
				case "pregunta":
					this.respuesta = '';
					this.tiempoRespuesta = 0;
				break;
			}

			this.url.navegar(pagina);
		});
	},

	responder(opcion){
		if(this.tiempo > 0){
			// console.log("responder", opcion, `jugadores/${this.jugador}/`);
			this.tiempoRespuesta = this.tiempo;
			this.respuesta = opcion;
			this.firebase.actualizar(`jugadores/${this.jugador}/respuesta`, opcion);
			this.firebase.actualizar(`jugadores/${this.jugador}/tiempo`, this.tiempoRespuesta);
		}
	},

	deshabilitada(id){
		const a = this.restante == 0;
		const b = !isNaN(parseInt(this.respuesta));
		const c = parseInt(this.respuesta) != id;

		return (a || b) && (c);
	}



}
