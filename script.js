const body = document.querySelector('body');
const overlay = document.querySelector('.overlay');
const progressBar = document.querySelector('.progress-bar');
const canvas = document.getElementById('audio_visual');
const audioElement = document.getElementById('source');
const nav = document.getElementById('nav');
const container = document.querySelector('.container');
const buttons = document.querySelectorAll('.container button');
let ctx = canvas.getContext('2d');

const state = {
	isRainbow: false,

	firstColor: '#f700cf',
	secondColor: '#00ffe0',
};

// Dat.GUI
const gui = new dat.GUI({ name: 'My GUI' });

gui.add(state, 'isRainbow');
gui.addColor(state, 'firstColor');
gui.addColor(state, 'secondColor');

// Initial
body.style.backgroundImage = `url('${buttons[0].dataset.imageurl}')`;
audioElement.src = `./${buttons[0].dataset.link}`;
audioElement.volume = 0.2;

buttons.forEach((button) => {
	button.addEventListener('click', (e) => {
		audioElement.pause();
		audioElement.currentTime = 0;

		audioElement.src = `./${e.target.dataset.link}`;
		body.style.backgroundImage = `url('${e.target.dataset.imageurl}')`;

		overlay.classList.remove('show');
		setTimeout(() => {
			overlay.classList.add('show');
		}, 300);
	});
});

nav.addEventListener('click', () => {
	container.classList.toggle('show');

	if (container.classList.contains('show')) {
		nav.innerText = 'Hide';
	} else {
		nav.innerText = 'Show';
	}
});

// Audio processing
const audioCtx = new AudioContext();
let analyser = audioCtx.createAnalyser();
let source = audioCtx.createMediaElementSource(audioElement);

// set frequency resolution array of 2048 / 2 = 1024
// need to be the power of 2
const frequencyResolutionAmount = 1024;

let canvasCenterX = canvas.width / 2;
let canvasCenterY = canvas.height / 2;
const visualizeDataAmount = frequencyResolutionAmount / 2;
const amplitude = 1.5;
const radius = 20;

analyser.fftSize = frequencyResolutionAmount * 2;

source.connect(analyser);
//this connects our music back to the default output, such as your //speakers
source.connect(audioCtx.destination);

let data = new Uint8Array(analyser.frequencyBinCount);

function loopingFunction() {
	requestAnimationFrame(loopingFunction);

	analyser.getByteFrequencyData(data);

	draw(data);
}

function draw(data) {
	data = [...data];
	ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);

	data.forEach((value, i) => {
		if (i % 10 === 0 && i < visualizeDataAmount) {
			ctx.beginPath();
			const startingPoint = {
				x:
					canvasCenterX +
					Math.sin(2 * Math.PI * (i / visualizeDataAmount)) * radius,
				y:
					canvasCenterY +
					Math.cos(2 * Math.PI * (i / visualizeDataAmount)) * radius,
			};

			const endPoint = {
				x:
					canvasCenterX +
					Math.sin(2 * Math.PI * (i / visualizeDataAmount)) * radius +
					Math.sin(2 * Math.PI * (i / visualizeDataAmount)) * value * amplitude,
				y:
					canvasCenterY +
					Math.cos(2 * Math.PI * (i / visualizeDataAmount)) * radius +
					Math.cos(2 * Math.PI * (i / visualizeDataAmount)) * value * amplitude,
			};

			const gradient = ctx.createLinearGradient(
				startingPoint.x,
				startingPoint.y,
				endPoint.x,
				endPoint.y
			);
			gradient.addColorStop(0, state.firstColor);
			gradient.addColorStop(1, state.secondColor);

			ctx.strokeStyle = state.isRainbow
				? `hsl(${(i / visualizeDataAmount) * 360},100%,50%)`
				: gradient;

			// start from inner circle
			ctx.moveTo(startingPoint.x, startingPoint.y); //x,y

			// end on outer circle canvas boundary
			ctx.lineTo(endPoint.x, endPoint.y); //x,y
			ctx.stroke();
		}
	});
}

audioElement.onplay = () => {
	audioCtx.resume();

	container.classList.remove('show');
	nav.innerText = 'Show';
};

audioElement.ontimeupdate = () => {
	progressBar.style.background = state.isRainbow
		? `linear-gradient(to right, red, orange, yellow, green, blue, magenta, purple)`
		: `linear-gradient(to right, ${state.firstColor}, ${state.secondColor})`;
	progressBar.style.width = `${
		(Math.floor(audioElement.currentTime) / Math.floor(audioElement.duration)) *
		100
	}%`;
};

loopingFunction();
