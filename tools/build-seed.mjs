/**
 * Builds: data/poi/poi_collection_template.csv, data/poi/seed_collection.csv,
 *         data/poi/import_example.json, docs/poi/FIELD_DICTIONARY.md
 * from data/poi/source/poi_starter_original.csv (preserved unchanged) plus the overrides below.
 * Run: node tools/build-seed.mjs
 */
import fs from 'node:fs';
import { parseCsv, toCsv } from '../src/poi/csv.js';
import { TEMPLATE_HEADERS, fieldDictionaryMarkdown } from '../src/poi/template.js';

const orig = parseCsv(fs.readFileSync('data/poi/source/poi_starter_original.csv', 'utf8')).records;
const DOC = 'User-supplied Word document (original retained privately, not in this repo)';
const TODAY = '2026-11-12';

// Facts below come from the document titles / source URLs only. States are "inferred" until a reviewer confirms.
const O = {
  'SEED-001': { zh: '', cat: 'food', sub: 'market', state: 'Kuala Lumpur', doc: '02-ICC-Pudu.docx', tags: 'food|heritage|breakfast' },
  'SEED-002': { zh: '双峰塔', cat: 'landmark', state: 'Kuala Lumpur', doc: '03-Petronas-Twin-Towers-.docx', related: 'SEED-003|SEED-010', tags: 'landmark|family-friendly' },
  'SEED-003': { zh: '双峰塔空中天桥', cat: 'landmark', sub: 'viewpoint', state: 'Kuala Lumpur', doc: '04-Skybridge-.docx', parent: 'SEED-002', tags: 'viewpoint' },
  'SEED-004': { zh: '吉隆坡塔', cat: 'landmark', sub: 'viewpoint', state: 'Kuala Lumpur', doc: '05-Menara-Kuala-Lumpur-.docx', tags: 'viewpoint' },
  'SEED-005': { zh: '吉隆坡旧火车站', cat: 'heritage', state: 'Kuala Lumpur', doc: '06-Kuala-Lumpur-Railway-Station-.docx', tags: 'heritage' },
  'SEED-006': { zh: '何九海南茶店', cat: 'food', sub: 'kopitiam', state: 'Kuala Lumpur', doc: '07-food-venues.docx', tags: 'food|heritage|coffee-shop', related: 'SEED-007|SEED-013' },
  'SEED-007': { zh: '碧华楼', cat: 'food', sub: 'restaurant', state: 'Kuala Lumpur', doc: '07-food-venues.docx', tags: 'food|heritage', related: 'SEED-006|SEED-013' },
  'SEED-008': { zh: '国家清真寺', cat: 'culture', sub: 'mosque', state: 'Kuala Lumpur', doc: '08-National-Mosque-of-Malaysia-.docx', tags: 'heritage' },
  'SEED-009': { zh: '国家皇宫', cat: 'landmark', sub: 'palace', state: 'Kuala Lumpur', doc: '08-Istana-Negara-.docx + 09-Istana-Negara-.docx (byte-identical duplicates)', tags: 'photo-stop' },
  'SEED-010': { zh: '城中城水族馆', cat: 'family', sub: 'aquarium', state: 'Kuala Lumpur', doc: '07-Aquaria-KLCC-.docx + 10-Aquaria-KLCC-.docx (byte-identical duplicates)', tags: 'family-friendly', related: 'SEED-002' },
  'SEED-011': { zh: '黑风洞', cat: 'nature', sub: 'cave temple', state: 'Selangor', stateBasis: 'documented', doc: '01-Batu-Caves-.docx', tags: 'heritage|adventure|family-friendly', note: 'Geographically in Selangor; commonly included in Kuala Lumpur tours.' },
  'SEED-012': { zh: '莎罗马行人天桥', cat: 'landmark', sub: 'pedestrian bridge', state: 'Kuala Lumpur', doc: '02-Saloma-Link-Pintasan-Saloma-.docx', tags: 'evening|photo-stop' },
  'SEED-013': { zh: '茨厂街', cat: 'culture', sub: 'market', state: 'Kuala Lumpur', doc: '03-Petaling-Street-Market-Chinatown-.docx', tags: 'food|heritage|evening' },
  'SEED-014': { zh: '苏丹阿都沙末大厦', cat: 'heritage', state: 'Kuala Lumpur', doc: '04-Bangunan-Sultan-Abdul-Samad-.docx', tags: 'heritage', related: 'SEED-015|SEED-016' },
  'SEED-015': { zh: '独立广场', cat: 'heritage', sub: 'square', state: 'Kuala Lumpur', doc: '05-Dataran-Merdeka-.docx', tags: 'heritage', related: 'SEED-014|SEED-016' },
  'SEED-016': { zh: '吉隆坡城市画廊', cat: 'museum', state: 'Kuala Lumpur', doc: '06-Dataran-Merdeka-Kuala-Lumpur-City-Gallery-....docx', tags: 'photo-stop', related: 'SEED-014|SEED-015', note: 'Source document is a photo description; confirm it is a separate POI from Dataran Merdeka.' },
  'SEED-017': { cat: 'culture', sub: 'temple', state: 'Kuala Lumpur' }, 'SEED-018': { cat: 'culture', sub: 'market', state: 'Kuala Lumpur' },
  'SEED-019': { cat: 'culture', sub: 'temple', state: 'Kuala Lumpur' }, 'SEED-020': { cat: 'culture', sub: 'mosque', state: 'Kuala Lumpur' },
  'SEED-021': { cat: 'nature', state: 'Selangor' }, 'SEED-022': { cat: 'nature', sub: 'paddy fields', state: 'Selangor' },
  'SEED-023': { cat: 'culture', state: 'Selangor' }, 'SEED-024': { cat: 'nature', sub: 'firefly park', state: 'Selangor', tags: 'evening' },
  'SEED-025': { cat: 'nature', note: 'Borders Kuala Lumpur and Selangor; state left blank for review.' },
  'SEED-026': { cat: 'nature', sub: 'cave', state: 'Perak', tags: 'adventure' }, 'SEED-027': { cat: 'nature', state: 'Perak' },
  'SEED-028': { cat: 'nature', state: 'Perak', tags: 'adventure' },
  'SEED-029': { cat: 'culture', sub: 'street art', state: 'Penang' }, 'SEED-030': { cat: 'culture', state: 'Penang' },
  'SEED-031': { cat: 'culture', sub: 'crafts studio', state: 'Penang', tags: 'hidden-gem' }, 'SEED-032': { cat: 'farm', state: 'Penang', tags: 'hidden-gem' },
  'SEED-033': { cat: 'nature', sub: 'mangrove', state: 'Penang' },
  'SEED-034': { cat: 'nature', state: 'Pahang' }, 'SEED-035': { cat: 'family', state: 'Pahang' },
  'SEED-036': { cat: 'farm', sub: 'orchard', state: 'Penang', tags: 'hidden-gem|food|family-friendly' },
  'SEED-037': { cat: 'farm', sub: 'orchard lodge', state: 'Perak', tags: 'hidden-gem' },
  'SEED-038': { cat: 'farm', tags: 'hidden-gem' }, 'SEED-039': { cat: 'culture', tags: 'hidden-gem' }
};

const rows = orig.map((r) => {
  const o = O[r.candidate_id] || {};
  const row = Object.fromEntries(TEMPLATE_HEADERS.map((h) => [h, '']));
  Object.assign(row, {
    candidate_id: r.candidate_id, name_en: r.name_en, name_zh: o.zh || '', category: o.cat || '', subcategory: o.sub || '',
    tags: o.tags || '', state: o.state || '', state_basis: o.stateBasis || (o.state ? 'inferred' : 'unknown'),
    latitude: r.latitude, longitude: r.longitude, coordinate_status: r.latitude ? r.coordinates_status : 'unknown',
    location_note: o.note || '', duration_minutes: r.suggested_duration_minutes, status: 'needs_review',
    origin: r.origin, review_notes: [r.notes, r.possible_duplicate_or_related && `Starter note: ${r.possible_duplicate_or_related}`].filter(Boolean).join(' | '),
    related_candidate_ids: o.related || '', parent_candidate_id: o.parent || '', review_flags: 'unverified_import'
  });
  if (o.doc) {
    Object.assign(row, {
      source_1_name: `${DOC}: ${o.doc}`, source_1_type: 'contributor', source_1_accessed_at: TODAY,
      source_1_supports: 'name_zh|historical_description', source_1_notes: 'Historical claims in the document are unverified; text not republished here. Chinese name taken from document title.'
    });
    if (/identical/.test(o.doc)) row.review_flags += '|duplicate_source_documents';
  } else if (r.source_url) {
    Object.assign(row, { source_1_name: new URL(r.source_url).hostname, source_1_url: r.source_url, source_1_type: /atlasobscura|trip\.com/.test(r.source_url) ? (r.source_url.includes('trip.com') ? 'trip_com' : 'traveller_review') : /malaysia\.travel|mypenang/.test(r.source_url) ? 'tourism_authority' : 'operator', source_1_accessed_at: TODAY, source_1_supports: 'existence', source_1_notes: 'Listed as a research candidate in the handover; page not yet verified.' });
  }
  if (!o.state && !r.candidate_id.startsWith('SEED-0')) row.review_flags += '|state_unknown';
  return row;
});

// Research pilot enrichment: Green Acres (SEED-036). durian_picking stays unknown on purpose.
const ga = rows.find((r) => r.candidate_id === 'SEED-036');
Object.assign(ga, {
  latitude: '5.37473', longitude: '100.25139', coordinate_source: 'penang-traveltips.com (third-party site, GPS shown there)',
  coordinate_status: 'source_reported', location_note: 'Coordinates reported by a third-party page; not verified on site.',
  duration_minutes: '120', duration_basis: 'sourced', farm_tour: 'confirmed', fruit_tasting: 'confirmed', durian_tasting: 'confirmed',
  fruit_picking: 'unknown', herb_picking: 'unknown', durian_picking: 'unknown',
  activity_season_note: 'Durian-related activities are seasonal; months not confirmed.',
  summary_en: 'Chemical-free hillside orchard in Balik Pulau running guided farm tours with fruit and durian tasting.',
  source_1_name: 'Green Acres Orchard & Ecolodge (operator booking site)', source_1_type: 'operator',
  source_1_supports: 'farm_tour|existence', source_1_accessed_at: TODAY,
  source_1_notes: 'Operator listing is titled farm tour + fruit tasting + lunch; page body is JavaScript-rendered and could not be read automatically. About page: 16-acre chemical-free orchard. Picking of fruit/herbs not confirmed in text I could read.',
  source_2_name: 'Buletin Mutiara (news article quoting the owner)', source_2_url: 'https://www.buletinmutiara.com/durian-fans-eager-to-know-more-about-the-fruit/', source_2_type: 'other', source_2_accessed_at: TODAY,
  source_2_supports: 'durian_tasting|duration', source_2_notes: 'Owner quoted: two-hour "Durian Tasting Farm Tours" from 1 June 2022. Dated 2022; re-check.',
  source_3_name: 'Klook (reseller listing, Chinese)', source_3_url: 'https://www.klook.cn/zh-CN/activity/39396-durian-tasting-orchard-tour-penang/', source_3_type: 'other', source_3_accessed_at: TODAY,
  source_3_supports: 'duration|tasting', source_3_notes: 'CONFLICT: reseller text mentions experiencing durian picking; operator sources read so far only describe tasting. durian_picking left unknown until the operator confirms.',
  review_flags: 'unverified_import|durian_picking_conflict|operator_page_unreadable|coordinates_third_party'
});

fs.writeFileSync('data/poi/poi_collection_template.csv', '\uFEFF' + toCsv(TEMPLATE_HEADERS, []));
fs.writeFileSync('data/poi/seed_collection.csv', '\uFEFF' + toCsv(TEMPLATE_HEADERS, rows));
fs.writeFileSync('docs/poi/FIELD_DICTIONARY.md', `# POI field dictionary (CSV columns)\n\nGenerated from \`src/poi/template.js\` by \`node tools/build-seed.mjs\`. Do not edit by hand.\n\nOnly one name is required to save a draft. Everything else is optional. Unknown stays blank or \`unknown\`; never guess.\nPrivate columns (commission, driver notes) are **not importable**: they are ignored and reported.\n\n${fieldDictionaryMarkdown()}\n`);

const example = {
  namespace: 'example-2026',
  pois: [{
    candidateId: 'EX-001',
    names: { en: 'Example Durian Orchard', zh: '示例榴莲园', ms: 'Dusun Durian Contoh' },
    aliases: ['Example Orchard'], category: 'farm', subcategory: 'orchard', tags: ['hidden-gem', 'family-friendly'],
    summary: { en: 'Synthetic example record for import testing.', zh: '用于导入测试的示例记录。' },
    location: { state: 'Penang', city: 'Balik Pulau', lat: null, lng: null, coordinateStatus: 'unknown', locationNote: 'Example: coordinates unknown' },
    visit: { experienceTypes: ['farm', 'food'], durationMinutes: 120, durationBasis: 'estimate', hours: { text: '', checkedAt: '' } },
    activities: { farmTour: 'confirmed', durianTasting: 'confirmed', fruitPicking: 'unknown', durianPicking: 'unknown', seasonalNote: 'Example only' },
    sources: [{ name: 'Operator website (example)', url: 'https://example.com/orchard', type: 'operator', accessedAt: TODAY, supports: ['farm_tour'], notes: 'Synthetic' }],
    review: { flags: ['synthetic_example'] }
  }]
};
fs.writeFileSync('data/poi/import_example.json', JSON.stringify(example, null, 2) + '\n');
console.log(`seed rows: ${rows.length}`);
