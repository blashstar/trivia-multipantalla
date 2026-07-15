
export function letra(numero){
	return String.fromCharCode(65 + parseInt(numero));
}


export function numero(letra){
	return letra.toUpperCase().charCodeAt(0) - 65;
}
