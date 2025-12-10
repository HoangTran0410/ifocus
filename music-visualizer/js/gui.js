import Config from "./config.js";
import { analyser, init, setFftSize } from "./audio.js";

const gui = new dat.GUI({ name: "Music Visualizer" });
gui.width = 300;

const analyserFolder = gui.addFolder("Analyzer");
analyserFolder
  .add(Config, "fftSize", [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384])
  .onFinishChange((val) => {
    setFftSize(val);
  });
analyserFolder.add(Config, "temporalSmoothing", 0, 1, 0.01).onChange((val) => {
  analyser.smoothingTimeConstant = val;
});
analyserFolder.add(Config, "minDecibels", -100, 0, 1).onChange((val) => {
  analyser.minDecibels = val;
});
analyserFolder.add(Config, "maxDecibels", -100, 100, 1).onChange((val) => {
  analyser.maxDecibels = val;
});
analyserFolder.add(Config, "freqStartIndex", 0, 1024, 1).name("Start index");
analyserFolder.add(Config, "freqLength", 3, 1024, 1).name("Frequency length");

const savitskyGolaySmoothingFolder = gui.addFolder("Savitsky-Golay Smoothing");
savitskyGolaySmoothingFolder.add(Config, "smoothEnabled", true, false);
savitskyGolaySmoothingFolder.add(Config, "smoothingPasses", 1, 5, 1);
savitskyGolaySmoothingFolder.add(Config, "smoothingPoints", 1, 5, 1);

const musicFolder = gui.addFolder("Music");

gui.add({ play: () => init(false) }, "play");

export default gui;
