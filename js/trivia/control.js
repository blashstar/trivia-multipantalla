import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";
import firebase from '../util/firebase.js';
import {letra, numero} from '../util/texto.js';
import plantilla from './plantilla.js';

// console.log(plantilla);

export default {
	titulo: "Juego",
	evento: "demo",
	modulo: "control",
	pagina : "#",

	preguntas: [],
	jugadores: [],
	seleccionada: null,
	segundos: 5,
	tiempo: 0,
	tiempoRestante: 0,
	tiempoInicio: null,
	intervaloTiempo: null,

	firebase,

	letra,

	utilizadas: [],
	get disponibles(){
		return _.reject(this.preguntas, pregunta => this.utilizadas.includes(pregunta.numero));
	},

	get pregunta() {
		return this.preguntas[this.seleccionada] ?? null;
	},

	get respuestas() {
		let lista = _.filter(this.jugadores, (item) => item?.respuesta != '')
		lista = _.orderBy(lista, "tiempo", "asc");

		return lista;
	},

	async init(){
		Object.assign(this, opcionesJuego);
		this.firebase.configurar(opcionesJuego, plantilla);

		const evento = await this.firebase.obtener("/");
		if(_.isNull(evento)){
			this.firebase.actualizar("/", plantilla);
		}

		this.firebase.actualizar("control", true);
		// console.log(gsap);
		// this.firebase.conectar("preguntas", this, "preguntas");
		this.firebase.conectar("jugadores", this, "jugadores");

		// this.firebase.vigilar("jugadores", jugadores => {
		// 	if(_.every(jugadores, (item) => item.respuesta != null)){
		// 		this.evaluarRespuestas();
		// 		this.tiempoRestante = 0;
		// 		this.tiempo = 0;
		// 	}
		// });

		// this.$watch("jugadores", (jugadores) => {
		// 	console.log("this.tiempoRestante", this.tiempoRestante, this.tiempoRestante > 0)
		// 	if(_.every(jugadores, (item) => item.respuesta != null) && this.tiempoRestante > 0){

		// 		this.evaluarRespuestas();
		// 		this.tiempoRestante = 0;
		// 		this.tiempo = 0;
		// 	}
		// })

		// _.forEach(this.jugadores, (jugador, id) => {
		// 	this.$watch(jugadores[id].respuesta, () => {
		// 		console.log("$watch(jugadores[id].respuesta");
		// 		if(_.every(jugadores, (item) => item.respuesta != null)){
		// 			this.evaluarRespuestas();
		// 			this.tiempoRestante = 0;
		// 			this.tiempo = 0;s
		// 		}
		// 	})
		// });


	},

	mostrarPantalla(nombre) {
		this.firebase.actualizar("juego/pagina", nombre);
		// console.log('nombre', nombre);

		switch(nombre){
			case "pregunta":
				_.forEach(this.jugadores, (jugador, id) => {
					this.firebase.actualizar(`jugadores/${id}/pagina`, 'pregunta');
				});
			break;
			case "podio":
				_.forEach(this.jugadores, (jugador, id) => {
					this.firebase.actualizar(`jugadores/${id}/pagina`, 'final');
				});
				const audio = new Audio("snd/celebra.mp3");
				audio.play();
			break;
			default:
				_.forEach(this.jugadores, (jugador, id) => {
					this.firebase.actualizar(`jugadores/${id}/pagina`, 'espera');
				});
		}


	},

	mostrarPantallaJugador(nombre) {
		this.firebase.actualizar("jugador/pagina", nombre);
	},

	seleccionarPregunta() {
		// this.seleccionada = Math.floor(Math.random() * this.preguntas.length);
		if(_.isEmpty(this.disponibles)){
			this.utilizadas = [];
		}

		const elegida = _.sample(this.disponibles);
		if(!elegida){
			this.seleccionada = null;
			console.warn('No hay preguntas disponibles para mostrar.');
			return;
		}

		this.seleccionada = _.findIndex(this.preguntas, { 'numero': elegida.numero});
		this.utilizadas.push(elegida.numero);
	},

	mostrarPregunta() {
		this.detenerConteo();
		// if(_.isNull(this.seleccionada)){
			this.seleccionarPregunta();
		// }
		if(_.isNull(this.seleccionada) || this.seleccionada === -1){
			return;
		}
		this.firebase.actualizar("juego/pregunta", this.pregunta);
		this.firebase.actualizar("juego/respuesta", "");
		this.mostrarPantalla('pregunta');
		// this.firebase.actualizar("juego/pagina", "pregunta");
		// this.firebase.actualizar("jugador/pagina", "pregunta");

		_.forEach(this.jugadores, (jugador, id) => {
			// this.reiniciarJugador(id);
			this.firebase.actualizar(`jugadores/${id}/respuesta`, '');
			this.firebase.actualizar(`jugadores/${id}/tiempo`, 0);
		});

		this.iniciarConteo();
	},

	mostrarRespuesta() {
		if(!_.isNull(this.seleccionada)){
			this.firebase.actualizar("juego/respuesta", this.pregunta.respuestas[this.pregunta.correcta]);
		}
	},

	ocultarRespuesta() {
		if(!_.isNull(this.seleccionada)){
			this.firebase.actualizar("juego/respuesta", "");
		}
	},

	iniciarConteo() {
		this.detenerConteo();

		if(!this.segundos || this.segundos <= 0){
			console.warn('El tiempo máximo no está configurado o es 0. Usando 30 segundos por defecto.');
			this.segundos = 30;
		}

		this.tiempo = 0;
		this.tiempoRestante = this.segundos;
		this.tiempoInicio = _.now();

		this.firebase.actualizar("juego/tiempo", 0);
		this.firebase.actualizar("juego/tiempoRestante", this.segundos);

		this.intervaloTiempo = setInterval(() => {
			const transcurrido = (_.now() - this.tiempoInicio) / 1000;
			this.tiempo = _.clamp(transcurrido, 0, this.segundos);
			this.tiempoRestante = _.clamp(this.segundos - this.tiempo, 0, this.segundos);

			this.firebase.actualizar("juego/tiempo", this.tiempo);
			this.firebase.actualizar("juego/tiempoRestante", this.tiempoRestante);

			const hayJugadores = _.size(this.jugadores) > 0;
			const todosRespondieron = hayJugadores && _.every(
				this.jugadores,
				(item) => item?.respuesta != null && item?.respuesta !== ''
			);

			if(this.tiempoRestante <= 0 || todosRespondieron){
				this.detenerConteo();
				this.evaluarRespuestas();
			}
		}, 100);
	},

	detenerConteo() {
		if(this.intervaloTiempo){
			clearInterval(this.intervaloTiempo);
			this.intervaloTiempo = null;
		}
	},

	evaluarRespuestas(){
		// console.log("this.evaluarRespuestas()", this.respuestas);
		// console.table(_.sortBy(this.jugadores, "tiempo"));
		const primero = _.head(
			_.sortBy(
				_.filter(
					this.jugadores,
					{respuesta: this.pregunta?.correcta}
				),
				"tiempo",
				"asc"
			)
		);

		// console.table(_.isNil(ganador), ganador, ganador?.puntaje);
		if(!_.isNil(primero)){
			// const id = primero.etiqueta.charCodeAt(0) - 65;
			const id = numero(primero.etiqueta);
			this.firebase.actualizar(`jugadores/${id}/puntaje`, primero.puntaje + 1);
		}

		const ganador = _.head(
			_.orderBy(
				this.jugadores,
				['puntaje', 'tiempo'],
				['desc', 'asc']
			)
		);

		if(!_.isNil(ganador)){
			this.firebase.actualizar("juego/ganador", ganador.etiqueta);
		}

	},

	reiniciarJugador(id){
		// this.firebase.actualizar(`jugadores/${id}/puntaje`, 0);
		this.firebase.actualizar(`jugadores/${id}/respuesta`, null);
		this.firebase.actualizar(`jugadores/${id}/tiempo`, 0);
		// this.firebase.actualizar(`jugadores/${id}/correcta`, false);
		this.firebase.actualizar(`jugadores/${id}/estado`, "parado");
		this.firebase.actualizar(`jugadores/${id}/puntaje`, 0);
		// this.firebase.actualizar(`jugadores/${id}/gana`, false);
	},


	reiniciarJugadores(){
		_.forEach(this.jugadores, (jugador, id) => {
			this.reiniciarJugador(id);
		});
	},

	reiniciarJuego(){
		this.detenerConteo();
		this.firebase.actualizar('juego/comando', "inicio");
		this.firebase.actualizar('juego/pregunta', null);
		this.firebase.actualizar('juego/ganador', false);
		this.firebase.actualizar('jugadores', {});
		this.mostrarPantalla('inicio');

		this.seleccionada = null;
		this.tiempo = 0;
		this.tiempoRestante = 0;
		this.utilizadas = [];

		this.firebase.actualizar('juego/comando', "");

		location.reload();

		// this.$nextTick(() => this.firebase.actualizar('juego/comando', ""));
	}
}
