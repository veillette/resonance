/**
 * BesselFunctions.ts
 *
 * Bessel function implementations for circular plate modal calculations.
 * Provides J_m (Bessel functions of the first kind) and Y_m (second kind)
 * for integer orders m = 0, 1, 2, ...
 *
 * Also includes precomputed Bessel zeros for efficient modal calculations.
 */

/**
 * Euler-Mascheroni constant for Bessel Y calculations.
 */
const EULER_GAMMA = 0.5772156649015329;

/**
 * Maximum number of terms in series expansion.
 */
const MAX_TERMS = 50;

/**
 * Convergence threshold for series.
 */
const EPSILON = 1e-15;

/**
 * Calculate the Bessel function of the first kind J_m(x).
 * Uses series expansion for small x and asymptotic expansion for large x.
 *
 * J_m(x) = (x/2)^m * sum_{k=0}^{inf} [(-1)^k * (x/2)^{2k}] / [k! * (m+k)!]
 *
 * @param m - Order (non-negative integer)
 * @param x - Argument
 * @returns J_m(x)
 */
export function besselJ(m: number, x: number): number {
  if (x === 0) {
    return m === 0 ? 1 : 0;
  }

  const absX = Math.abs(x);

  // Use asymptotic expansion for large x
  if (absX > 20 + m) {
    return besselJAsymptotic(m, absX) * (x < 0 && m % 2 !== 0 ? -1 : 1);
  }

  // Series expansion
  const halfX = x / 2;
  let term = Math.pow(halfX, m) / factorial(m);
  let sum = term;
  const halfXSquared = -halfX * halfX;

  for (let k = 1; k < MAX_TERMS; k++) {
    term *= halfXSquared / (k * (m + k));
    sum += term;

    if (Math.abs(term) < EPSILON * Math.abs(sum)) {
      break;
    }
  }

  return sum;
}

/**
 * Asymptotic expansion of J_m(x) for large x.
 * J_m(x) ~ sqrt(2/(pi*x)) * cos(x - m*pi/2 - pi/4)
 */
function besselJAsymptotic(m: number, x: number): number {
  const phase = x - (m * Math.PI) / 2 - Math.PI / 4;
  const amplitude = Math.sqrt(2 / (Math.PI * x));
  return amplitude * Math.cos(phase);
}

/**
 * Calculate the Bessel function of the second kind Y_m(x).
 * Also known as Neumann function.
 *
 * For integer orders:
 * Y_0(x) = (2/pi) * [J_0(x) * (ln(x/2) + gamma) + series terms]
 * Y_m(x) = (2/pi) * [J_m(x) * ln(x/2) - (1/x^m) * sum + ...]
 *
 * @param m - Order (non-negative integer)
 * @param x - Argument (must be > 0)
 * @returns Y_m(x)
 */
export function besselY(m: number, x: number): number {
  if (x <= 0) {
    return -Infinity;
  }

  // Use asymptotic expansion for large x
  if (x > 20 + m) {
    return besselYAsymptotic(m, x);
  }

  if (m === 0) {
    return besselY0(x);
  } else if (m === 1) {
    return besselY1(x);
  } else {
    // Use recurrence relation: Y_{m+1}(x) = (2m/x) * Y_m(x) - Y_{m-1}(x)
    let yPrev = besselY0(x);
    let yCurr = besselY1(x);

    for (let k = 1; k < m; k++) {
      const yNext = ((2 * k) / x) * yCurr - yPrev;
      yPrev = yCurr;
      yCurr = yNext;
    }

    return yCurr;
  }
}

/**
 * Y_0(x) using series expansion.
 */
function besselY0(x: number): number {
  const j0 = besselJ(0, x);
  const halfX = x / 2;
  const logTerm = (2 / Math.PI) * (Math.log(halfX) + EULER_GAMMA) * j0;

  // Series correction term
  let sum = 0;
  let term = 1;
  const halfXSquared = -halfX * halfX;
  let harmonicSum = 0;

  for (let k = 1; k < MAX_TERMS; k++) {
    harmonicSum += 1 / k;
    term *= halfXSquared / (k * k);
    sum += harmonicSum * term;

    if (Math.abs(term) < EPSILON) {
      break;
    }
  }

  return logTerm + (2 / Math.PI) * sum;
}

/**
 * Y_1(x) using series expansion.
 */
function besselY1(x: number): number {
  const j1 = besselJ(1, x);
  const halfX = x / 2;
  const logTerm = (2 / Math.PI) * (Math.log(halfX) + EULER_GAMMA) * j1;

  // Series correction terms
  const twoOverPiX = 2 / (Math.PI * x);
  let sum = -twoOverPiX;

  let term = halfX;
  const halfXSquared = -halfX * halfX;
  let harmonicSum1 = 1;
  let harmonicSum2 = 0;

  for (let k = 1; k < MAX_TERMS; k++) {
    harmonicSum1 += 1 / k;
    harmonicSum2 += 1 / (k + 1);
    term *= halfXSquared / (k * (k + 1));
    sum += term * (harmonicSum1 + harmonicSum2);

    if (Math.abs(term) < EPSILON) {
      break;
    }
  }

  return logTerm - (1 / Math.PI) * sum;
}

/**
 * Asymptotic expansion of Y_m(x) for large x.
 * Y_m(x) ~ sqrt(2/(pi*x)) * sin(x - m*pi/2 - pi/4)
 */
function besselYAsymptotic(m: number, x: number): number {
  const phase = x - (m * Math.PI) / 2 - Math.PI / 4;
  const amplitude = Math.sqrt(2 / (Math.PI * x));
  return amplitude * Math.sin(phase);
}

/**
 * Calculate factorial using cached values.
 */
const factorialCache: number[] = [1];
function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n < factorialCache.length) return factorialCache[n]!;

  let result = factorialCache[factorialCache.length - 1]!;
  for (let i = factorialCache.length; i <= n; i++) {
    result *= i;
    factorialCache.push(result);
  }
  return result;
}

/**
 * Precomputed zeros of J_m(x) for circular plate modes.
 * besselJZeros[m][n] = nth zero of J_m(x) for m = 0..8, n = 0..7
 * These are where J_m(k*R) = 0 for the clamped boundary condition.
 */
export const BESSEL_J_ZEROS: readonly (readonly number[])[] = [
  // m = 0: J_0 zeros
  [2.4048, 5.5201, 8.6537, 11.7915, 14.9309, 18.0711, 21.2116, 24.3525],
  // m = 1: J_1 zeros
  [3.8317, 7.0156, 10.1735, 13.3237, 16.4706, 19.6159, 22.7601, 25.9037],
  // m = 2: J_2 zeros
  [5.1356, 8.4172, 11.6198, 14.796, 17.9598, 21.117, 24.2701, 27.4206],
  // m = 3: J_3 zeros
  [6.3802, 9.761, 13.0152, 16.2235, 19.4094, 22.5827, 25.7482, 28.9084],
  // m = 4: J_4 zeros
  [7.5883, 11.0647, 14.3725, 17.616, 20.8269, 24.019, 27.1991, 30.3699],
  // m = 5: J_5 zeros
  [8.7715, 12.3386, 15.7002, 18.9801, 22.2178, 25.4303, 28.6266, 31.8117],
  // m = 6: J_6 zeros
  [9.9361, 13.5893, 17.0038, 20.3208, 23.5861, 26.8202, 30.0337, 33.2331],
  // m = 7: J_7 zeros
  [11.0864, 14.8213, 18.2876, 21.6415, 24.9349, 28.1912, 31.4228, 34.6371],
  // m = 8: J_8 zeros
  [12.2251, 16.0378, 19.5545, 22.9452, 26.2668, 29.5457, 32.7958, 36.0256],
];

/**
 * Get the nth zero of J_m(x).
 *
 * @param m - Order (0 to 8)
 * @param n - Zero index (0 to 7)
 * @returns The nth zero of J_m, or NaN if out of range
 */
export function getBesselJZero(m: number, n: number): number {
  if (m < 0 || m > 8 || n < 0 || n > 7) {
    // Estimate using asymptotic formula for higher orders
    // Zero locations are approximately at (m + 2n + 1/2) * pi/2 for large n
    return ((4 * n + 2 * m + 1) * Math.PI) / 4;
  }
  return BESSEL_J_ZEROS[m]![n]!;
}

/**
 * Derivative of J_m(x): J'_m(x) = (J_{m-1}(x) - J_{m+1}(x)) / 2
 * For m = 0: J'_0(x) = -J_1(x)
 *
 * @param m - Order (non-negative integer)
 * @param x - Argument
 * @returns J'_m(x)
 */
export function besselJPrime(m: number, x: number): number {
  if (m === 0) {
    return -besselJ(1, x);
  }
  return (besselJ(m - 1, x) - besselJ(m + 1, x)) / 2;
}

/**
 * Precomputed zeros of J'_m(x) for free boundary condition.
 * These are where J'_m(k*R) = 0.
 */
export const BESSEL_J_PRIME_ZEROS: readonly (readonly number[])[] = [
  // m = 0: J'_0 zeros (where J_1 = 0, since J'_0 = -J_1)
  [3.8317, 7.0156, 10.1735, 13.3237, 16.4706, 19.6159, 22.7601, 25.9037],
  // m = 1: J'_1 zeros
  [1.8412, 5.3314, 8.5363, 11.706, 14.8636, 18.0155, 21.1644, 24.3113],
  // m = 2: J'_2 zeros
  [3.0542, 6.7061, 9.9695, 13.1704, 16.3475, 19.5129, 22.672, 25.8266],
  // m = 3: J'_3 zeros
  [4.2012, 8.0152, 11.3459, 14.5858, 17.7887, 20.9725, 24.1449, 27.3097],
  // m = 4: J'_4 zeros
  [5.3176, 9.2824, 12.6819, 15.9641, 19.196, 22.4014, 25.5898, 28.7668],
  // m = 5: J'_5 zeros
  [6.4156, 10.5199, 13.9872, 17.3128, 20.5755, 23.8036, 27.0103, 30.2028],
  // m = 6: J'_6 zeros
  [7.5013, 11.7349, 15.2682, 18.6374, 21.9317, 25.1839, 28.4141, 31.628],
  // m = 7: J'_7 zeros
  [8.5778, 12.9324, 16.5294, 19.9419, 23.2681, 26.5503, 29.8033, 33.0353],
  // m = 8: J'_8 zeros
  [9.6474, 14.1155, 17.7741, 21.2291, 24.5872, 27.8995, 31.1801, 34.4396],
];

/**
 * Get the nth zero of J'_m(x).
 *
 * @param m - Order (0 to 8)
 * @param n - Zero index (0 to 7)
 * @returns The nth zero of J'_m, or estimate if out of range
 */
export function getBesselJPrimeZero(m: number, n: number): number {
  if (m < 0 || m > 8 || n < 0 || n > 7) {
    // Estimate using asymptotic formula
    return ((4 * n + 2 * m + 3) * Math.PI) / 4;
  }
  return BESSEL_J_PRIME_ZEROS[m]![n]!;
}
