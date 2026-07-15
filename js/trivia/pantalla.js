import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";
import { gsap } from "https://cdn.jsdelivr.net/gh/greensock/gsap@3.10.4/esm/gsap-core.js";
import confetti, { create } from 'https://cdn.jsdelivr.net/npm/canvas-confetti@0.2.0-beta0/dist/confetti.module.mjs';
import qr from '../util/qr.js';
import firebase from '../util/firebase.js';
import url from '../util/url.js';
import {letra} from '../util/texto.js';
import { gif1px, urlImagen } from '../util/imagen.js';
import plantilla from './plantilla.js';

export default {
	titulo: "Juego",
	evento: "demo",
	modulo: "pantalla",
	pantallas: {
		inicio: {
			fondo: gif1px,
		},
		carrera: {
			fondo: gif1px,
		},
	},

	urJugadores: "",
	invitacion: "",

	sexos:{
		"F": "mujer",
		"M": "hombre",
	},

	maximoJugadores: 3,
	jugadores: [],
	avatares:{},
	pregunta: {},
	respuestaCorrecta: "",
	tiempo: 0,
	tiempoRestante: 0,
	// qr: false,
	// pagina: "#",

	firebase,
	url,

	letra,

	get pagina(){
		return this.url.id;
	},

	get fondo(){
		return urlImagen(this.pantallas[this.pagina]?.fondo);
	},

	get logoCompleto(){
		return urlImagen(this.logo);
	},

	get urlJugadoresCompleta(){
		const url = this.urlJugadores ?? '';

		if(_.startsWith(url, 'http://') || _.startsWith(url, 'https://')){
			return url;
		}

		if(_.startsWith(url, '/')){
			return `${location.origin}${url}`;
		}

		return `${location.origin}/${url}`;
	},

	get ganadores(){
		return _.orderBy(
			this.jugadores,
			['puntaje', 'tiempo'],
			['desc', 'asc']
		);
	},

	init(){
		Object.assign(this, opcionesJuego);
		this.invitacion = qr.generar(this.urlJugadoresCompleta).outerHTML;

		// const evento = await this.firebase.obtener("/");
		// if(_.isNull(evento)){
		// 	this.firebase.actualizar("/", plantilla);
		// }
		// const imagenQR = qr.generar(this.urJugadores);
		// this.$refs.qrJugadores.appendChild(imagenQR);
		// console.log(imagenQR.outerHTML);

		// console.log(JSON.stringify(this.$refs));

		this.firebase.configurar(opcionesJuego, plantilla);

		this.firebase.conectar("jugadores", this, "jugadores");
		this.firebase.conectar("juego/pregunta", this, "pregunta");
		this.firebase.conectar("juego/respuesta", this, "respuestaCorrecta");
		this.firebase.conectar("juego/tiempo", this, "tiempo");
		this.firebase.conectar("juego/tiempoRestante", this, "tiempoRestante");

		this.firebase.vigilar('juego/pagina', pagina => {
			// console.log(pagina.val());
			this.url.navegar(pagina.val());

			this.$nextTick(() => this.alMostrarPantalla());
		})

		this.firebase.vigilar('juego/comando', comando => {
			// console.log('juego/comando', comando.val());
			switch(comando.val()){
				case "inicio":
					// this.navegar("inicio");
					_.forEach(this.jugadores, (jugador, id) => {
						// console.log(id, jugador);
						this.avatares[id].avance = `avance-0`;
					});
				break;
				case "avances":
					this.actualizarAvances();
				break;
			}
			// this.firebase.actualizar("juego/comando", "");
		});

		for (let i = 0; i < this.maximoJugadores; i++) {
			this.avatares[i] = {
				pose:"parado",
				avance: 'avance-0'
			};

			this.$watch(`avatares[${i}].avance`, (nuevo, anterior) => {
				this.avatares[i].pose = "corriendo";
				setTimeout(
					() => {
						this.avatares[i].pose = "parado";
					},
					1000
				);

			});
		}

	},

	alMostrarPantalla(){

		switch(this.pagina){
			case "espera":
				// console.table(this.$refs);
			break;
			case "carrera":
				this.actualizarAvances();
			break;
			case "podio":
				this.mostrarConfetti();
			break;
		}
	},

	actualizarAvances(forzar = false){
		_.forEach(this.jugadores, (jugador, id) => {
			gsap.delayedCall(1, () => {
				const avance = _.clamp(jugador?.puntaje, 0, 4);
				this.avatares[id].avance = `avance-${avance}`;
			});
		});
	},


	mostrarConfetti(){
		const pantalla = document.querySelector("#podio");
		console.log(pantalla);
		// confetti();
		var count = 200;
		var defaults = {
			origin: { y: 0.75 }
		};

		function lanzar(particleRatio, opts) {
			confetti(Object.assign({}, defaults, opts, {
				particleCount: Math.floor(count * particleRatio)
			}));
		}

		const tiempo = 0.5;

		gsap.delayedCall(tiempo, lanzar, [
			0.25 ,
			{ spread: 26, startVelocity: 55 }
		]);
		gsap.delayedCall(tiempo, lanzar, [
			0.20 ,
			{ spread: 60 }
		]);
		gsap.delayedCall(tiempo, lanzar, [
			0.35 ,
			{ spread: 100, decay: 0.91, scalar: 0.8 }
		]);
		gsap.delayedCall(tiempo, lanzar, [
			0.1 ,
			{ spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }
		]);
		gsap.delayedCall(tiempo, lanzar, [
			0.1 ,
			{ spread: 120, startVelocity: 45 }
		]);
	}

}
