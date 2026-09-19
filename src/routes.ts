export const routes = {
 purple: { name: 'Purple Line', color: '#aa71db', terminals: 'Whitefield (Kadugodi) ↔ Challaghatta', stations: ['Indiranagar', 'Halasuru', 'Trinity', 'Mahatma Gandhi Road', 'Cubbon Park'], kannada: ['ಇಂದಿರಾನಗರ', 'ಹಲಸೂರು', 'ಟ್ರಿನಿಟಿ', 'ಮಹಾತ್ಮ ಗಾಂಧಿ ರಸ್ತೆ', 'ಕಬ್ಬನ್ ಉದ್ಯಾನ'], underground: [false, false, false, false, true], km: [1.2, 1.2, 1.2, 1.3] },
 green: { name: 'Green Line', color: '#65bd93', terminals: 'Madavara ↔ Silk Institute', stations: ['Nadaprabhu Kempegowda Stn., Majestic', 'Chickpete', 'Krishna Rajendra Market', 'National College'], kannada: ['ನಾಡಪ್ರಭು ಕೆಂಪೇಗೌಡ ನಿಲ್ದಾಣ, ಮೆಜೆಸ್ಟಿಕ್', 'ಚಿಕ್ಕಪೇಟೆ', 'ಕೃಷ್ಣ ರಾಜೇಂದ್ರ ಮಾರುಕಟ್ಟೆ', 'ನ್ಯಾಷನಲ್ ಕಾಲೇಜು'], underground: [true, true, true, false], km: [1.1, 1.1, 1.2] }
};
export type Line = keyof typeof routes;
export const duration = (km: number) => km * 60;
// Trapezoidal velocity, integrated and normalized: 12 s acceleration/braking.
export function motion(t: number, total: number) {
 const ramp = 12, area = total - ramp;
 const speed = Math.min(t / ramp, 1, (total - t) / ramp);
 const distance = t < ramp ? t * t / (2 * ramp) : t > total - ramp ? area - (total - t) ** 2 / (2 * ramp) : t - ramp / 2;
 return { progress: Math.max(0, Math.min(1, distance / area)), speed: Math.max(0, speed) };
}
