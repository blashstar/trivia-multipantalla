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

	urlJugadores: "",
	invitacion: "",
	textos: {
		bienvenida: "¡Bienvenido al reto!",
		instrucciones: [
			"Mira atentamente la pregunta que proyectaremos en pantalla gigante.",
			"Recuerda: solo tienes {segundos} segundos para responder.",
			"Selecciona tu respuesta en tu celular.",
			"Cada ronda incluye 6 preguntas.",
			"Debes acertar al menos 3 preguntas para ganar.",
			"Cada acierto suma puntos.",
			"Y ya sabes... ¡nada de mirar las respuestas del otro, eh!"
		],
		qrTitulo: "Escanea el QR",
		qrSubtitulo: "para empezar a jugar",
		instruccionesTitulo: "Instrucciones",
		ranking: "Ranking",
	},

	sexos:{
		"F": "mujer",
		"M": "hombre",
	},

	jugadores: [],
	avatares:{},
	pregunta: {},
	respuestaCorrecta: "",
	tiempo: 0,
	tiempoRestante: 0,
	segundos: 10,

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

	async init(){
		Object.assign(this, opcionesJuego);

		// Restaurar textos con placeholder {segundos} (brand.json los sobrescribe sin placeholder)
		this.textos = {
			bienvenida: "¡Bienvenido al reto!",
			instrucciones: [
				"Mira atentamente la pregunta que proyectaremos en pantalla gigante.",
				"Recuerda: solo tienes {segundos} segundos para responder.",
				"Selecciona tu respuesta en tu celular.",
				"Cada ronda incluye 6 preguntas.",
				"Debes acertar al menos 3 preguntas para ganar.",
				"Cada acierto suma puntos.",
				"Y ya sabes... ¡nada de mirar las respuestas del otro, eh!"
			],
			qrTitulo: "Escanea el QR",
			qrSubtitulo: "para empezar a jugar",
			instruccionesTitulo: "Instrucciones",
			ranking: "Ranking",
		};

		if(this.colores){
			const root = document.documentElement;
			for(const [clave, valor] of Object.entries(this.colores)){
				root.style.setProperty(`--color-${clave}`, valor);
			}
		}

		this.invitacion = qr.generar(this.urlJugadoresCompleta).outerHTML;

		await this.firebase.configurar(opcionesJuego, plantilla);

		const segundosFirebase = await this.firebase.obtener("juego/segundos");
		if(segundosFirebase != null){
			this.segundos = segundosFirebase;
		}

		this.firebase.conectar("jugadores", this, "jugadores");
		this.firebase.conectar("juego/pregunta", this, "pregunta");
		this.firebase.conectar("juego/respuesta", this, "respuestaCorrecta");
		this.firebase.conectar("juego/tiempo", this, "tiempo");
		this.firebase.conectar("juego/tiempoRestante", this, "tiempoRestante");
		this.firebase.conectar("juego/segundos", this, "segundos");

		this.firebase.vigilar('juego/pagina', pagina => {
			this.url.navegar(pagina.val());

			this.$nextTick(() => this.alMostrarPantalla());
		})

		this.firebase.vigilar('juego/comando', comando => {
			switch(comando.val()){
				case "inicio":
					_.forEach(this.jugadores, (jugador, id) => {
						this.avatares[id].avance = `avance-0`;
					});
				break;
				case "avances":
					this.actualizarAvances();
				break;
			}
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
