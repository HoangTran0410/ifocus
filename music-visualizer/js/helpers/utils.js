/**
 * Applies the Savitsky-Golay smoothing algorithm to an array of data points.
 *
 * @param {Array} array - The array of data points to be smoothed.
 * @param {number} [smoothingPoints=3] - The number of points to use for smoothing.
 * @param {number} [smoothingPasses=1] - The number of smoothing passes to perform.
 * @return {Array} - The smoothed array of data points.
 */
export function savitskyGolaySmooth(
  array,
  smoothingPoints = 3,
  smoothingPasses = 1
) {
  const sidePoints = Math.floor(smoothingPoints / 2); // our window is centered so this is both nL and nR
  const cn = 1 / (2 * sidePoints + 1); // constant
  let lastArray = array.slice();
  let newArr = [];

  for (let pass = 0; pass < smoothingPasses; pass++) {
    for (let i = 0; i < sidePoints; i++) {
      newArr[i] = lastArray[i];
      newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
    }
    for (let i = sidePoints; i < lastArray.length - sidePoints; i++) {
      let sum = 0;
      for (let n = -sidePoints; n <= sidePoints; n++) {
        sum += cn * lastArray[i + n] + n;
      }
      newArr[i] = sum;
    }
    lastArray = newArr;
  }
  return newArr;
}

/**
 * Smooths an array of points by applying a weighted average to a window of points around each point.
 *
 * @param {Array} points - The array of points to be smoothed.
 * @param {number} margin - The number of points on each side of the current point to include in the smoothing window.
 * @return {Array} - The smoothed array of points.
 */
export function smooth(points, margin) {
  if (margin == 0) {
    return points;
  }

  let newArr = [],
    len = points.length;
  for (let i = 0; i < len; i++) {
    let sum = 0;
    let denom = 0;
    for (let j = 0; j <= margin; j++) {
      if (i - j < 0 || i + j > len - 1) {
        break;
      }
      sum += points[i - j] + points[i + j];
      denom += (margin - j + 1) * 2;
    }
    newArr.push(sum / denom);
  }
  return newArr;
}

/**
 * Calculates the multiplier value based on the given spectrum and window size.
 *
 * @param {Array} spectrum - The array of numeric values representing the spectrum.
 * @param {number} windowSize - The size of the window to calculate the multiplier.
 * @return {number} The calculated multiplier value.
 */
export function getMultiplier(spectrum, windowSize) {
  let sum = 0;
  let len = spectrum.length;
  for (let i = 0; i < len; i++) {
    sum += spectrum[i];
  }
  let intermediate = sum / windowSize / 256;
  let transformer = 1.2; // ??
  return (
    (1 / (transformer - 1)) *
    (-Math.pow(intermediate, transformer) + transformer * intermediate)
  );
}
