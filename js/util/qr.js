import QRCode from 'https://cdn.jsdelivr.net/gh/lostinbrittany/qr-esm@master/index.js';

// console.log(QRCode);

// console.log('typeof module', typeof module);

export default {

	generar(url){
		// console.log('url', url);
		const qrcode = QRCode.generateSVG(url, {
			mode: 'octet',
			ecclevel: 'Q',

			modulesize: 1,
			margin: 2,
		});

		qrcode.style.width = "100%";
		qrcode.style.height = "100%";
		qrcode.style.maxWidth = "100vW";
		qrcode.style.maxHeight = "100vh";

		return qrcode;
	}

}
