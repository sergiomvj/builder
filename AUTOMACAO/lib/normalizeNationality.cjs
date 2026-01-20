// CommonJS copy of normalizeNationality for projects using "type": "module" in package.json
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function fallbackFromCountryCode(countryCode) {
  const map = {
    'BR': 'Brasileira',
    'US': 'Americana',
    'CA': 'Canadense',
    'MX': 'Mexicana',
    'GB': 'Inglesa',
    'DE': 'Alemã',
    'FR': 'Francesa',
    'IT': 'Italiana',
    'ES': 'Espanhola',
    'AR': 'Argentina',
    'CN': 'Chinesa',
    'JP': 'Japonesa',
    'KR': 'Sul-coreana',
    'RU': 'Russa',
    'IN': 'Indiana'
  };
  return map[countryCode] || 'Internacional';
}

function normalizeNationality(nationalityText, countryCode) {
  if (!nationalityText) return fallbackFromCountryCode(countryCode);

  const raw = String(nationalityText).trim();
  const s = raw
    .toLowerCase()
    .replace(/[-–—_\\/]/g, '')
    .replace(/\s+/g, '');

  if (s.indexOf('internacion') !== -1 || s === 'internacional') {
    return fallbackFromCountryCode(countryCode);
  }

  if (s.indexOf('canadense') !== -1 || s.indexOf('canada') !== -1) return 'Canadense';
  if (s.indexOf('brasil') !== -1 || s.indexOf('brasileira') !== -1) return 'Brasileira';
  if (s.indexOf('mex') !== -1 || s.indexOf('mexicana') !== -1) return 'Mexicana';
  if (s.indexOf('american') !== -1 || s.indexOf('americana') !== -1 || s.indexOf('eua') !== -1) return 'Americana';
  if (s.indexOf('portug') !== -1 || s.indexOf('portuguesa') !== -1) return 'Portuguesa';
  if (s.indexOf('franc') !== -1 || s.indexOf('francesa') !== -1) return 'Francesa';
  if (s.indexOf('ital') !== -1 || s.indexOf('italiana') !== -1) return 'Italiana';
  if (s.indexOf('alem') !== -1 || s.indexOf('german') !== -1) return 'Alemã';
  if (s.indexOf('esp') !== -1 || s.indexOf('espan') !== -1) return 'Espanhola';
  if (s.indexOf('ingles') !== -1 || s.indexOf('ingl') !== -1) return 'Inglesa';

  const cleaned = raw.split(/[-–—_\\/]+/).map(w => w.trim()).filter(Boolean).map(capitalize).join(' ');
  return cleaned || fallbackFromCountryCode(countryCode);
}

module.exports = { normalizeNationality, fallbackFromCountryCode };
