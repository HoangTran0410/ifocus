import Config from "../config.js";
import Constants from "../constants.js";
import { smooth } from "../helpers/utils.js";
import Component from "./Component.js";

class TrapNation extends Component {
  spectrumCache = Array();

  draw(spectrum, multiplier, context = this.context) {
    const { spectrumCache } = this;
    const ghostLength = Config.spectrumGhosts.length;

    if (spectrumCache.length >= ghostLength) {
      spectrumCache.shift();
    }
    spectrumCache.push(spectrum);

    let curRad = this.calcRadius(multiplier);

    for (let s = ghostLength - 1; s >= 0; s--) {
      const ghost = Config.spectrumGhosts[s];

      let curSpectrum = smooth(
        spectrumCache[Math.max(spectrumCache.length - ghost.delay - 1, 0)],
        ghost.smoothMargin
      );

      let points = [];
      let len = curSpectrum.length;
      for (let i = 0; i < len; i++) {
        const t = Math.PI * (i / (len - 1)) - Constants.HALF_PI;
        const r =
          curRad +
          Math.pow(
            curSpectrum[i] * 0.4, //* Util.getResolutionMultiplier()
            ghost.exponent
          );
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        points.push({ x: x, y: y });
      }

      context.fillStyle = ghost.color;
      context.shadowColor = ghost.color;
      context.shadowBlur = ghost.blurRadius;
      this.drawPoints(points, context);
    }
  }

  drawPoints(points, context = this.context) {
    if (points.length == 0) {
      return;
    }

    context.beginPath();

    let centerX = this.x + this.w / 2;
    let centerY = this.y + this.h / 2;

    for (let neg = 0; neg <= 1; neg++) {
      let xMult = neg ? -1 : 1;

      context.moveTo(centerX, points[0].y + centerY);

      let len = points.length;
      for (let i = 1; i < len - 2; i++) {
        let c = (xMult * (points[i].x + points[i + 1].x)) / 2 + centerX;
        let d = (points[i].y + points[i + 1].y) / 2 + centerY;
        context.quadraticCurveTo(
          xMult * points[i].x + centerX,
          points[i].y + centerY,
          c,
          d
        );
      }
      context.quadraticCurveTo(
        xMult * points[len - 2].x + centerX + neg * 2,
        points[len - 2].y + centerY,
        xMult * points[len - 1].x + centerX,
        points[len - 1].y + centerY
      );
    }
    context.fill();
  }

  calcRadius(multiplier) {
    let maxR = Math.min(this.w, this.h) / 2;
    let minR = maxR / 2;
    return multiplier * (maxR - minR) + minR;
  }
}

export default TrapNation;
