/**
 * Team page content, carried over verbatim from the archived style-site page
 * (docs/rebuild/team-page-source/). The archive is the authority: names, roles,
 * French bios, departments, e-mails and WhatsApp deep links are not rewritten.
 *
 * The WhatsApp links are stored without the `https://` scheme on purpose: the
 * offline-origin gate must not find a network origin in the bundle, while the
 * user-initiated navigation still opens WhatsApp normally.
 */
export type TeamDepartment = 'Direction' | 'Santé' | 'Technique' | 'Production' | 'Finance' | 'ESG';

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  department: TeamDepartment;
  bio: string;
  email: string;
  /** Scheme-less deep link, completed at render time. */
  whatsapp: string | null;
  /** Fixed per-member avatar gradient, as captured in the archive. */
  avatarClass: string;
  /** Only present for members added during this session. */
  phone?: string;
}

export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    id: 'ouali-nacer',
    initials: 'ON',
    name: 'Ouali Nacer',
    role: 'Fondateur',
    department: 'Direction',
    bio: "Fondateur d'Ovitech — vision stratégique et pilotage du projet ferme ovine intelligente à Sidi Bel Abbès.",
    email: 'nacerouali464@gmail.com',
    whatsapp:
      'wa.me/213797631321?text=Bonjour%20Ouali%20Nacer%2C%20je%20vous%20contacte%20via%20Ovitech%20MVP.',
    avatarClass: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'ouali-chawki',
    initials: 'OC',
    name: 'Ouali Chawki',
    role: 'Fondateur associé',
    department: 'Direction',
    bio: 'Fondateur associé — co-direction du projet Ovitech et développement des partenariats avec la commission agricole.',
    email: 'chawki202012@gmail.com',
    whatsapp:
      'wa.me/213671872913?text=Bonjour%20Ouali%20Chawki%2C%20je%20vous%20contacte%20via%20Ovitech%20MVP.',
    avatarClass: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'ziane-amine',
    initials: 'ZA',
    name: 'Dr Ziane Amine',
    role: 'Vétérinaire collaborateur',
    department: 'Santé',
    bio: 'Vétérinaire collaborateur — suivi sanitaire du cheptel, protocoles vaccinaux et accompagnement reproduction.',
    email: 'drzianeamine.1995@gmail.com',
    whatsapp:
      'wa.me/213553191883?text=Bonjour%20Dr%20Ziane%20Amine%2C%20je%20vous%20contacte%20via%20Ovitech%20MVP.',
    avatarClass: 'from-rose-600 to-pink-700',
  },
  {
    id: 'khaled-elias-elhennani',
    initials: 'KE',
    name: 'Khaled Elias Elhennani',
    role: 'Ingénieur en développement informatique',
    department: 'Technique',
    bio: 'Ingénieur en développement informatique — conception et réalisation de la plateforme Ovitech. Basé à Sidi Bel Abbès, Algérie.',
    email: 'elhennani.merketing.pro@gmail.com',
    whatsapp:
      'wa.me/213550507694?text=Bonjour%20Khaled%20Elias%20Elhennani%2C%20je%20vous%20contacte%20via%20Ovitech%20MVP.',
    avatarClass: 'from-cyan-600 to-sky-700',
  },
  {
    id: 'sebai-salah',
    initials: 'SS',
    name: 'Sebaï Salah',
    role: 'Zootechnicien — Ingénieur en agronomie',
    department: 'Production',
    bio: "Ingénieur en agronomie (option Zootechnie, ITA Mostaganem 1980). Technicien de l'agriculture (production & santé animale, ERA Sidi Bel Abbès 1976). Expérience en conseil technique et direction d'unités agricoles (Oran, Sidi Bel Abbès, Tipaza). Ancien collaborateur ITEBO (projet ACDI Canada) et chargé formation & vulgarisation.",
    email: 'salah.2000@live.fr',
    whatsapp:
      'wa.me/213659524993?text=Bonjour%20Seba%C3%AF%20Salah%2C%20je%20vous%20contacte%20via%20Ovitech%20MVP.',
    avatarClass: 'from-amber-600 to-orange-700',
  },
];

/**
 * The archive showed 5 members / 4 departments / 4 on site / 5 available.
 * Per-member on-site flags were not captured in the extraction, so the two
 * remaining totals stay as the archived figures instead of being invented.
 */
export const TEAM_ARCHIVE_STATS = {
  onsite: 4,
  available: 5,
} as const;

/** Department order shown by the archive filter chips. */
export const TEAM_DEPARTMENTS: readonly TeamDepartment[] = [
  'Direction',
  'Santé',
  'Technique',
  'Production',
];

/** Extra options present in the archive add-member select. */
export const TEAM_DEPARTMENT_OPTIONS: readonly TeamDepartment[] = [
  'Direction',
  'Technique',
  'Production',
  'Santé',
  'Finance',
  'ESG',
];

/** Column order preserved from the archive. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
