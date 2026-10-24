/**
 * generateSilk.js
 *
 * Generates a deterministic jockey silk SVG based on a hash of the horse name.
 * Each horse gets a consistent, unique silk — same name always produces the
 * same colours and pattern.
 *
 * The SVG renders a proper jockey silk shape:
 * - Peaked cap above
 * - Rounded body (torso)
 * - Two sleeve "wings" extending left and right
 * - Pattern applied to the body section
 *
 * Patterns: plain, horizontal_stripes, vertical_stripes, chevron, diamond,
 *           spots, quartered
 */

// Curated palette of 18 racing colours — representative of real silks
const COLOURS = [
  '#C41E3A', // crimson
  '#1B4F8A', // royal blue
  '#2E7D32', // emerald green
  '#F4A300', // gold
  '#7B2D8B', // purple
  '#FF6B2B', // orange
  '#1A237E', // navy
  '#00695C', // teal
  '#B71C1C', // deep red
  '#4A148C', // deep purple
  '#FF8F00', // amber
  '#0D47A1', // cobalt
  '#FFFFFF', // white
  '#000000', // black
  '#F5F5F5', // off-white
  '#FFD700', // bright gold
  '#8B0000', // dark red
  '#006400', // dark green
];

const PATTERNS = [
  'plain',
  'horizontal_stripes',
  'vertical_stripes',
  'chevron',
  'diamond',
  'spots',
  'quartered',
];

/**
 * Simple deterministic hash from a string.
 * djb2 algorithm — fast, good distribution for short strings.
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

/**
 * Ensure two colours have enough visual contrast to be distinguishable.
 * If they're the same, shift the secondary by a fixed offset.
 */
function ensureContrast(idx1, idx2) {
  if (idx1 === idx2) return (idx2 + 3) % COLOURS.length;
  return idx2;
}

/**
 * Generate pattern SVG elements to overlay on the silk body.
 * clipPath constrains patterns to the body shape.
 */
function renderPattern(pattern, bodyColour, secondaryColour, uid) {
  switch (pattern) {
    case 'horizontal_stripes':
      return `
        <rect x="10" y="18" width="20" height="3" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <rect x="10" y="24" width="20" height="3" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <rect x="10" y="30" width="20" height="3" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'vertical_stripes':
      return `
        <rect x="14" y="14" width="3" height="25" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <rect x="20" y="14" width="3" height="25" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <rect x="26" y="14" width="3" height="25" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'chevron':
      return `
        <polygon points="20,16 26,24 20,24" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <polygon points="20,16 14,24 20,24" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <polygon points="20,24 26,32 20,32" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <polygon points="20,24 14,32 20,32" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'diamond':
      return `
        <polygon points="20,16 26,24 20,32 14,24" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'spots':
      return `
        <circle cx="16" cy="20" r="2.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <circle cx="24" cy="20" r="2.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <circle cx="20" cy="27" r="2.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <circle cx="16" cy="33" r="2.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <circle cx="24" cy="33" r="2.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'quartered':
      return `
        <rect x="10" y="14" width="10" height="12.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
        <rect x="20" y="26.5" width="10" height="12.5" fill="${secondaryColour}" clip-path="url(#body-clip-${uid})" />
      `;

    case 'plain':
    default:
      return '';
  }
}

/**
 * Generate a jockey silk SVG string for a given horse name.
 *
 * @param {string} horseName - Name of the horse (used as hash seed)
 * @param {number} size - Width in pixels (height = size * 1.2)
 * @returns {string} Complete SVG markup string
 */
export function generateSilkSVG(horseName, size = 40) {
  const hash = simpleHash(horseName);

  const bodyIdx = hash % COLOURS.length;
  const secIdx = ensureContrast(bodyIdx, (hash * 7 + 3) % COLOURS.length);
  const capIdx = (hash * 13 + 5) % COLOURS.length;

  const bodyColour = COLOURS[bodyIdx];
  const secondaryColour = COLOURS[secIdx];
  const capColour = COLOURS[capIdx];

  const pattern = PATTERNS[(hash * 3 + 1) % PATTERNS.length];

  // Unique ID suffix to prevent SVG clipPath collisions when multiple silks
  // are rendered on the same page
  const uid = hash.toString(36);

  const patternElements = renderPattern(pattern, bodyColour, secondaryColour, uid);

  const height = Math.round(size * 1.2);

  return `<svg width="${size}" height="${height}" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="body-clip-${uid}">
      <ellipse cx="20" cy="27" rx="12" ry="13" />
    </clipPath>
  </defs>

  <!-- Cap: peaked riding cap -->
  <ellipse cx="20" cy="8" rx="7" ry="5" fill="${capColour}" />
  <polygon points="15,5 20,1 25,5" fill="${capColour}" />
  <!-- Cap peak/visor -->
  <ellipse cx="24" cy="9" rx="5" ry="2" fill="${capColour}" opacity="0.7" />

  <!-- Body: oval torso -->
  <ellipse cx="20" cy="27" rx="12" ry="13" fill="${bodyColour}" />

  <!-- Pattern overlay (clipped to body shape) -->
  ${patternElements}

  <!-- Left sleeve -->
  <path d="M8,19 Q2,24 4,32 L10,30 Q9,24 10,20 Z" fill="${secondaryColour}" />

  <!-- Right sleeve -->
  <path d="M32,19 Q38,24 36,32 L30,30 Q31,24 30,20 Z" fill="${secondaryColour}" />

  <!-- Subtle outline for definition on dark backgrounds -->
  <ellipse cx="20" cy="27" rx="12" ry="13" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" />
</svg>`;
}
