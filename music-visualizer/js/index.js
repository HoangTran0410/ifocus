import Config from "./config.js";
import gui from "./gui.js";
import { analyser, getSpectrum, init as initAudio } from "./audio.js";
import { getMultiplier, savitskyGolaySmooth } from "./helpers/utils.js";
import TrapNation from "./components/TrapNation.js";

const mouse = { x: 0, y: 0 };

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const components = [
  //
  new TrapNation(100, 100, 400, 400, context),
  new TrapNation(300, 500, 100, 100, context),
];

function resizeCanvas(w = window.innerWidth, h = window.innerHeight) {
  canvas.width = w;
  canvas.height = h;
}

window.addEventListener("resize", () => {
  resizeCanvas();
});

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

resizeCanvas();
draw();

function draw() {
  requestAnimationFrame(draw);

  context.fillStyle = "#222";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!analyser) return;

  let spectrum = getSpectrum();
  spectrum = spectrum.slice(
    Config.freqStartIndex,
    Config.freqStartIndex + Config.freqLength
  );

  if (Config.smoothEnabled) {
    spectrum = savitskyGolaySmooth(
      spectrum,
      Config.smoothingPoints,
      Config.smoothingPasses
    );
  }
  let multiplier = getMultiplier(spectrum, Config.freqLength);

  components.forEach((comp) => {
    comp.draw(spectrum, multiplier);
  });
}
