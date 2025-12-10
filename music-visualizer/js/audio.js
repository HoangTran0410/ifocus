import Config from "./config.js";

let audioContext, analyser, dataArray;

export { audioContext, analyser };

export function setFftSize(size) {
  analyser.fftSize = size;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

export function getSpectrum() {
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

export function init(connectToSoundOut = false) {
  getStreamFromOtherTab()
    .then((stream) => {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = Config.temporalSmoothing;
      analyser.minDecibels = Config.minDecibels;
      analyser.maxDecibels = Config.maxDecibels;
      setFftSize(Config.fftSize);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      if (connectToSoundOut) {
        analyser.connect(audioContext.destination);
      }
    })
    .catch((err) => {
      alert(err);
      console.log(err);
    });
}

export function getStreamFromOtherTab() {
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    audio: {
      suppressLocalAudioPlayback: false,
    },
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
  });
}
