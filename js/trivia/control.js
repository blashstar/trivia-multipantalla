import * as _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js";
import firebase from '../util/firebase.js';
import {letra, numero} from '../util/texto.js';
import plantilla from './plantilla.js';

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

		if(this.colores){
			const root = document.documentElement;
			for(const [clave, valor] of Object.entries(this.colores)){
				root.style.setProperty(`--color-${clave}`, valor);
			}
		}

		this.firebase.configurar(opcionesJuego, plantilla);

		const evento = await this.firebase.obtener("/");
		if(_.isNull(evento)){
			this.firebase.actualizar("/", plantilla);
		}

		this.firebase.actualizar("control", true);
		this.firebase.conectar("jugadores", this, "jugadores");
	},

	mostrarPantalla(nombre) {
		this.firebase.actualizar("juego/pagina", nombre);

		switch(nombre){
			case "puntajes":
				_.forEach(this.jugadores, (jugador, id) => {
					this.firebase.actualizar(`jugadores/${id}/pagina`, 'espera');
				});
				const audioPuntajes = new Audio("snd/celebra.mp3");
				audioPuntajes.play();
			break;
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


	seleccionarPregunta() {
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
		this.seleccionarPregunta();
		if(_.isNull(this.seleccionada) || this.seleccionada === -1){
			return;
		}
		this.firebase.actualizar("juego/pregunta", this.pregunta);
		this.firebase.actualizar("juego/respuesta", "");
		this.mostrarPantalla('pregunta');

		_.forEach(this.jugadores, (jugador, id) => {
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
			this.tiempoRestante = parseFloat(_.clamp(this.segundos - this.tiempo, 0, this.segundos).toFixed(3));

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

		if(!_.isNil(primero)){
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
		this.firebase.actualizar(`jugadores/${id}/respuesta`, null);
		this.firebase.actualizar(`jugadores/${id}/tiempo`, 0);
		this.firebase.actualizar(`jugadores/${id}/estado`, "parado");
		this.firebase.actualizar(`jugadores/${id}/puntaje`, 0);
	},


	reiniciarJugadores(){
		_.forEach(this.jugadores, (jugador, id) => {
			this.reiniciarJugador(id);
		});
	},

	async reiniciarJuego(){
		this.detenerConteo();

		await Promise.all([
			this.firebase.actualizar('juego/comando', "inicio"),
			this.firebase.actualizar('juego/pregunta', null),
			this.firebase.actualizar('juego/ganador', false),
			this.firebase.actualizar('jugadores', {}),
		]);

		this.seleccionada = null;
		this.tiempo = 0;
		this.tiempoRestante = 0;
		this.utilizadas = [];

		await this.firebase.actualizar('juego/comando', "");

		this.mostrarPantalla('inicio');
		location.reload();
	}
}
