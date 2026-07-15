import Alpine from 'https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.10.3/module.esm.js'
import app from './trivia/control.js';

window.Alpine = Alpine;
document.addEventListener('alpine:init', () => {
	Alpine.data("$aplicacion", () => app);
});

Alpine.start();
