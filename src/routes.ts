export const stations = [
 'Whitefield (Kadugodi)', 'Hopefarm Channasandra', 'Kadugodi Tree Park', 'Pattandur Agrahara',
 'Sri Sathya Sai Hospital', 'Nallurhalli', 'Kundalahalli', 'Seetharamapalya', 'Hoodi', 'Garudacharpalya',
 'Singayyanapalya', 'Krishnarajapura (KR Pura)', 'Benniganahalli', 'Baiyappanahalli', 'Swami Vivekananda Road',
 'Indiranagar', 'Halasuru', 'Trinity', 'Mahatma Gandhi Road', 'Cubbon Park',
 'Dr. B.R. Ambedkar Stn., Vidhana Soudha', 'Sir M. Visvesvaraya Stn., Central College',
 'Nadaprabhu Kempegowda Stn., Majestic', 'Krantivira Sangolli Rayanna Railway Station', 'Magadi Road',
 'Sri Balagangadharanatha Swamiji Stn., Hosahalli', 'Vijayanagara', 'Attiguppe', 'Deepanjali Nagar', 'Mysuru Road',
 'Pantharapalya–Nayandahalli', 'Rajarajeshwari Nagar', 'Jnanabharathi', 'Pattanagere', 'Kengeri Bus Terminal', 'Kengeri', 'Challaghatta',
] as const;
// Notion Purple Line bible / Vonter GTFS shapes, Whitefield → Challaghatta.
export const interStationM = [
 1046,969,1034,1499,735,1016,928,1032,1609,1241,1762,1081,
 1918,1035,1317,1391,1190,1144,1253,787,940,1330,814,1089,
 1140,1043,1091,1221,1090,801,831,806,1999,1595,1527,2073,
] as const;
const stationPositions = interStationM.reduce<number[]>((positions, metres) => {
 positions.push(positions[positions.length - 1] + metres);
 return positions;
}, [0]);
export const stationPosition = (index: number) => stationPositions[index];
export const totalLengthM = stationPositions[stationPositions.length - 1];
export const stationType = (index: number) => index >= 19 && index <= 23 ? 'Underground' : index === 13 ? 'At-grade' : 'Elevated';
export const kannada = ['ವೈಟ್‌ಫೀಲ್ಡ್ (ಕಾಡುಗೋಡಿ)', 'ಹೋಪ್‌ಫಾರ್ಮ್ ಚನ್ನಸಂದ್ರ', 'ಕಾಡುಗೋಡಿ ವೃಕ್ಷ ಉದ್ಯಾನ', 'ಪಟ್ಟಂದೂರು ಅಗ್ರಹಾರ', 'ಶ್ರೀ ಸತ್ಯ ಸಾಯಿ ಆಸ್ಪತ್ರೆ', 'ನಲ್ಲೂರಹಳ್ಳಿ', 'ಕುಂದಲಹಳ್ಳಿ', 'ಸೀತಾರಾಮಪಾಳ್ಯ', 'ಹೂಡಿ', 'ಗರುಡಾಚಾರ್ಪಾಳ್ಯ', 'ಸಿಂಗಯ್ಯನಪಾಳ್ಯ', 'ಕೃಷ್ಣರಾಜಪುರ', 'ಬೆನ್ನಿಗಾನಹಳ್ಳಿ', 'ಬೈಯಪ್ಪನಹಳ್ಳಿ', 'ಸ್ವಾಮಿ ವಿವೇಕಾನಂದ ರಸ್ತೆ', 'ಇಂದಿರಾನಗರ', 'ಹಲಸೂರು', 'ಟ್ರಿನಿಟಿ', 'ಮಹಾತ್ಮ ಗಾಂಧಿ ರಸ್ತೆ', 'ಕಬ್ಬನ್ ಉದ್ಯಾನ', 'ವಿಧಾನ ಸೌಧ', 'ಸೆಂಟ್ರಲ್ ಕಾಲೇಜು', 'ನಾಡಪ್ರಭು ಕೆಂಪೇಗೌಡ ಮೆಜೆಸ್ಟಿಕ್', 'ಕ್ರಾಂತಿವೀರ ಸಂಗೊಳ್ಳಿ ರಾಯಣ್ಣ ರೈಲು ನಿಲ್ದಾಣ', 'ಮಾಗಡಿ ರಸ್ತೆ', 'ಹೊಸಹಳ್ಳಿ', 'ವಿಜಯನಗರ', 'ಅತ್ತಿಗುಪ್ಪೆ', 'ದೀಪಾಂಜಲಿ ನಗರ', 'ಮೈಸೂರು ರಸ್ತೆ', 'ನಾಯಂಡಹಳ್ಳಿ', 'ರಾಜರಾಜೇಶ್ವರಿ ನಗರ', 'ಜ್ಞಾನಭಾರತಿ', 'ಪಟ್ಟಣಗೆರೆ', 'ಕೆಂಗೇರಿ ಬಸ್ ನಿಲ್ದಾಣ', 'ಕೆಂಗೇರಿ', 'ಚಲ್ಲಘಟ್ಟ'];
