const Config = {
  // analyzer config
  temporalSmoothing: 0.03,
  minDecibels: -85,
  maxDecibels: -22,
  fftSize: 8192,

  // emblem config
  minEmblemSize: 50,
  maxEmblemSize: 200,
  maxShakeIntensity: Math.PI / 3,
  maxShakeDisplacement: 8,
  minShakeScalar: 0.9,
  maxShakeScalar: 1.6,

  // transform config
  freqStartIndex: 4,
  freqLength: 25,

  // savitskyGolaySmooth
  smoothEnabled: false,
  smoothingPasses: 1,
  smoothingPoints: 3,

  spectrumGhosts: [
    {
      exponent: 1,
      color: "#FFFFFF",
      smoothMargin: 0,
      delay: 0,
      blurRadius: 5,
    },
    {
      exponent: 1.12,
      color: "#FFFF00",
      smoothMargin: 2,
      delay: 1,
      blurRadius: 5,
    },
    {
      exponent: 1.14,
      color: "#FF0000",
      smoothMargin: 2,
      delay: 2,
      blurRadius: 5,
    },
    {
      exponent: 1.3,
      color: "#FF66FF",
      smoothMargin: 3,
      delay: 3,
      blurRadius: 5,
    },
    {
      exponent: 1.33,
      color: "#333399",
      smoothMargin: 3,
      delay: 4,
      blurRadius: 5,
    },
    {
      exponent: 1.36,
      color: "#0000FF",
      smoothMargin: 3,
      delay: 5,
      blurRadius: 5,
    },
    {
      exponent: 1.5,
      color: "#33CCFF",
      smoothMargin: 5,
      delay: 6,
      blurRadius: 5,
    },
    {
      exponent: 1.52,
      color: "#00FF00",
      smoothMargin: 5,
      delay: 7,
      blurRadius: 5,
    },
  ],
};

export default Config;
