// Normalize nationality strings and provide country-code fallbacks (TypeScript/ESM)
export function fallbackFromCountryCode(countryCode?: string) {
  const map: Record<string, string> = {
    BR: 'Brasileira',
    US: 'Americana',
    CA: 'Canadense',
    MX: 'Mexicana',
    GB: 'Inglesa',
    DE: 'Alemã',
    FR: 'Francesa',
    IT: 'Italiana',
    ES: 'Espanhola',
    AR: 'Argentina',
    CN: 'Chinesa',
    JP: 'Japonesa',
    KR: 'Sul-coreana',
    RU: 'Russa',
    IN: 'Indiana'
  };
  if (!countryCode) return 'Internacional';
  return map[countryCode] || 'Internacional';
}

function capitalize(word: string) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function normalizeNationality(nationalityText?: string, countryCode?: string) {
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
  if (s.indexOf('argent') !== -1 || s.indexOf('argentino') !== -1) return 'Argentina';
  if (s.indexOf('chin') !== -1 || s.indexOf('chines') !== -1) return 'Chinesa';
  if (s.indexOf('jap') !== -1 || s.indexOf('japon') !== -1) return 'Japonesa';
  if (s.indexOf('core') !== -1 || s.indexOf('kore') !== -1) return 'Sul-coreana';
  if (s.indexOf('russ') !== -1 || s.indexOf('rus') !== -1) return 'Russa';
  if (s.indexOf('ind') !== -1 || s.indexOf('india') !== -1) return 'Indiana';

  const cleaned = raw.split(/[-–—_\\/]+/).map(w => w.trim()).filter(Boolean).map(capitalize).join(' ');
  return cleaned || fallbackFromCountryCode(countryCode);
}

export function getNationalitiesForCountry(countryCode?: string): string[] {
  const map: Record<string, string[]> = {
    BR: ['Brasileira', 'Portuguesa', 'Italiana', 'Alemã'],
    US: ['Americana', 'Mexicana', 'Canadense'],
    CA: ['Canadense', 'Francesa', 'Inglesa'],
    MX: ['Mexicana', 'Americana', 'Espanhola'],
    GB: ['Inglesa', 'Escocesa', 'Galesa', 'Irlandesa'],
    DE: ['Alemã', 'Turca'],
    FR: ['Francesa', 'Magrebina'],
    IT: ['Italiana', 'Romena'],
    ES: ['Espanhola', 'Latino-Americana'],
    AR: ['Argentina'],
    CN: ['Chinesa'],
    JP: ['Japonesa'],
    KR: ['Sul-coreana'],
    RU: ['Russa'],
    IN: ['Indiana']
  };
  if (!countryCode) return ['Internacional'];
  return map[countryCode] || [fallbackFromCountryCode(countryCode)];
}
