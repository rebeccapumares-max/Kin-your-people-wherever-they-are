import { FamilyMember, Memory, Recipe, Postcard, VoiceChain, VisitFund } from './types';

// Let's model a realistic diaspora family: The Rossi family
// Active user Mateo starts in Tokyo (UTC+9), Nonna is in Rome (UTC+2), Cousin Laura in Barcelona (UTC+2), Brother David in Boston (UTC-4)

export const INITIAL_MEMBERS: FamilyMember[] = [
  {
    id: 'mateo',
    name: 'Mateo (You)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    city: 'Tokyo',
    timezone: 'Asia/Tokyo', // UTC+9
    typicalSchedule: { startHour: 9, endHour: 23 },
    birthday: '09-12',
    relation: 'You',
    quietMode: false,
    languages: ['English', 'Spanish', 'Japanese']
  },
  {
    id: 'nonna',
    name: 'Nonna Maria',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    city: 'Rome',
    timezone: 'Europe/Rome', // UTC+2
    typicalSchedule: { startHour: 8, endHour: 21 },
    birthday: '05-28', // Upcoming soon!
    anniversary: '06-15',
    relation: 'Grandmother',
    quietMode: false,
    languages: ['Italian', 'Spanish']
  },
  {
    id: 'laura',
    name: 'Cousin Laura',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    city: 'Barcelona',
    timezone: 'Europe/Madrid', // UTC+2
    typicalSchedule: { startHour: 10, endHour: 23 },
    birthday: '11-04',
    relation: 'Cousin',
    quietMode: false,
    languages: ['Spanish', 'English', 'Catalan']
  },
  {
    id: 'david',
    name: 'Brother David',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    city: 'Boston',
    timezone: 'America/New_York', // UTC-4
    typicalSchedule: { startHour: 8, endHour: 22 },
    birthday: '02-14',
    relation: 'Brother',
    quietMode: true, // Currently resting!
    languages: ['English', 'Spanish']
  }
];

// Timezone offset helper (since we handle standard timezones statically)
export function getTimezoneOffsetHours(tz: string): number {
  switch (tz) {
    case 'Asia/Tokyo': return 9;
    case 'Europe/Rome': return 2;
    case 'Europe/Madrid': return 2;
    case 'America/New_York': return -4;
    default: return 0;
  }
}

export function getLocalTime(utcDateStr: string, timezone: string): Date {
  const utcDate = new Date(utcDateStr);
  const offset = getTimezoneOffsetHours(timezone);
  // Get time in UTC millis and add offset
  const utcMillis = utcDate.getTime() + utcDate.getTimezoneOffset() * 60000;
  return new Date(utcMillis + offset * 3600000);
}

// Check if a member is currently awake and in their reasonable hours (typical availability)
export function isGreenDotActive(utcDateStr: string, member: FamilyMember): { active: boolean; localTimeFormatted: string; currentHour: number } {
  const localDate = getLocalTime(utcDateStr, member.timezone);
  const hour = localDate.getHours();
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const localTimeFormatted = `${displayHour}:${minutes} ${period}`;
  
  if (member.quietMode) {
    return { active: false, localTimeFormatted, currentHour: hour };
  }

  const { startHour, endHour } = member.typicalSchedule;
  const active = hour >= startHour && hour < endHour;
  return { active, localTimeFormatted, currentHour: hour };
}

// Initial private memory shelf moments (scrapbook format, preloaded, with "Same Time Last Year")
export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'm1',
    title: 'Making Tiramisu with Nonna',
    type: 'photo',
    date: '2025-05-23', // Exactly 1 year ago! Let's highlight this for "Same Time Last Year"
    authorId: 'mateo',
    personId: 'nonna',
    photoUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    content: "Nonna taught me the secret of dunking the ladyfingers in espresso. Don't leave them in more than a heartbeat, she said! Still remember her laughter.",
    tags: ['Kitchen', 'Nonna', 'Tiramisu']
  },
  {
    id: 'm2',
    title: 'Voice Note: Grandpa\'s Favorite Joke',
    type: 'voice',
    date: '2024-08-10',
    authorId: 'nonna',
    audioUrl: 'simulated_audio_grandpa_joke',
    content: "Recording of Nonna repeating grandpa's famous story about the flat horse in Tuscany. Pure family gold.",
    tags: ['Grandpa', 'Laughs', 'Audio Archive']
  },
  {
    id: 'm3',
    title: 'Mateo\'s first week in Tokyo',
    type: 'photo',
    date: '2026-03-05',
    authorId: 'mateo',
    photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    content: "View from my flat in Shinjuku. Exhausted, but the neon lights feel like another planet. Wish Laura and David were here with me.",
    tags: ['Tokyo', 'Relocation', 'Neon']
  },
  {
    id: 'm4',
    title: 'David graduating Boston Uni',
    type: 'photo',
    date: '2024-05-18',
    authorId: 'david',
    personId: 'david',
    photoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    content: "Caps in the air! Nonna cried on the Zoom stream. Mateo woke up at 3 AM in Tokyo to watch it happen.",
    tags: ['Boston', 'Graduation', 'Milestone']
  },
  {
    id: 'm5',
    title: 'Capsule: Open on Laura\'s 30th Birthday',
    type: 'note',
    date: '2026-04-12',
    authorId: 'nonna',
    personId: 'laura',
    content: "Laura, you are our star. I have written down all the family recipes in a notebooks for you. I pray this capsule reminds you of Rome wherever you are.",
    tags: ['Capsule', 'Birthday', 'Tender'],
    isCapsule: true,
    unlockDate: '2027-11-04' // A year away
  }
];

// Initial preloaded recipe vault
export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: "Nonna's Double-Espresso Tiramisu",
    coverUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    voiceUrl: 'audio_nonna_explaining_tiramisu',
    taughtById: 'nonna',
    passedDownFromId: 'nonna',
    ingredients: [
      '500g Mascarpone cheese (room temp)',
      '4 Large egg yolks + 2 egg whites',
      '120g Granulated sugar',
      '300ml Strong espresso (cooled)',
      '1 Pack of Savoiardi / Ladyfingers',
      '2 tbsp Dark rum (optional)',
      'High-quality cocoa powder for dusting'
    ],
    instructions: [
      'Whisk yolks with half the sugar until pale and creamy. Fold in mascarpone gently.',
      'In a clean bowl, whip egg whites with remaining sugar to soft peaks, then fold into mascarpone mixture.',
      'Mix cooled coffee and dark rum in a shallow dish. Dip ladyfingers briefly (1 second each side!).',
      'Layer dipped biscuits in a dish, spread half the cream. Repeat layers. Chill for at least 6 hours.',
      'Dust generously with fine cocoa powder just before slicing and serving.'
    ],
    tags: ['Dessert', 'Italian', 'Passed Down', 'Holiday'],
    annotations: [
      {
        id: 'ra1',
        authorId: 'laura',
        text: 'Nonna, I tried substituting with Oatly whipping cream once, it works but lacks the richness. Stick to real eggs and room-temp mascarpone!',
        date: '2026-04-02'
      },
      {
        id: 'ra2',
        authorId: 'mateo',
        text: 'Adding a pinch of orange zest into the coffee brings it to a whole new level!',
        date: '2026-05-12'
      }
    ]
  },
  {
    id: 'r2',
    name: "Dad's Slow-Smoked BBQ Ribs",
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    taughtById: 'david',
    ingredients: [
      '2 Racks of Baby Back Pork Ribs',
      '4 tbsp Brown sugar',
      '1 tbsp Smoked paprika',
      '1 tsp Cayenne pepper, salt & black pepper',
      '1 cup Apple cider vinegar (for basted spray)',
      'Your favorite local BBQ glaze'
    ],
    instructions: [
      'Remove membrane from back of ribs. Set dry rub of brown sugar and spices thoroughly on both sides.',
      'Preheat smoker to 225°F (110°C) with apple wood chunks.',
      'Smoke ribs bone-side down for 3 hours. Spray with cider vinegar every 45 mins.',
      'Wrap in foil with a splash of apple cider and a pat of butter, smoke for another 2 hours.',
      'Unwrap, brush with BBQ glaze, and smoke uncovered for a final 45 mins until caramelized.'
    ],
    tags: ['Barbecue', 'American', 'Main Course'],
    annotations: [
      {
        id: 'ra3',
        authorId: 'david',
        text: 'Usually I use hickory wood in Boston, but apple wood keeps it light. Laura, let me know if you can find good smoked paprika in Spain!',
        date: '2025-10-15'
      }
    ]
  }
];

// Initial simulated postcards sent (Slow Post archive)
export const INITIAL_POSTCARDS: Postcard[] = [
  {
    id: 'p1',
    photoUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80',
    message: 'Nonna, the cherry blossoms in Kyoto are finally blooming. Keeping you close in my heart always. Love, Mateo.',
    senderId: 'mateo',
    recipientId: 'nonna',
    sentDate: '2026-05-18',
    delayDays: 5,
    arrivalDate: '2026-05-23', // Arrives today! Magical wait is over
    status: 'delivered',
    price: 3.50
  },
  {
    id: 'p2',
    photoUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
    message: 'Sunset off the Massachusetts Cape. Thinking of our family meals together. Miss you tons Laura!',
    senderId: 'david',
    recipientId: 'laura',
    sentDate: '2026-05-21',
    delayDays: 5,
    arrivalDate: '2026-05-26', // Still in route!
    status: 'pending',
    price: 2.50
  }
];

// Initial voice chains (talking letter threads)
export const INITIAL_CHAINS: VoiceChain[] = [
  {
    id: 'vc1',
    title: 'Sunday Morning Check-in 🌸',
    participants: ['mateo', 'nonna', 'laura', 'david'],
    messages: [
      {
        id: 'vm1',
        senderId: 'nonna',
        duration: 85,
        timestamp: '2026-05-20T10:00:00Z',
        audioUrl: 'simulated_audio_nonna',
        transcript: 'Hola family, it is Nonna here! Happy Sunday! I just had a beautiful morning walk in clean mountain air, and I am preparing some wild cherry preserves today. Mateo mijo, I miss your handsome smile. Send me your news soon!'
      },
      {
        id: 'vm2',
        senderId: 'david',
        duration: 124,
        timestamp: '2026-05-21T18:30:00Z',
        audioUrl: 'simulated_audio_david',
        transcript: 'Hey guys! David checking in from Boston. Postcards from Nonna arrived yesterday, they look awesome! I am training for a 10K run, so I am pretty hungry. Nonna, please save me a jar of those cherries when we meet up!'
      },
      {
        id: 'vm3',
        senderId: 'laura',
        duration: 62,
        timestamp: '2026-05-22T14:15:00Z',
        audioUrl: 'simulated_audio_laura',
        transcript: 'Hey everyone, Laura here in sunny Barcelona! I am looking at the beach as I speak. We should definitely activate our flight savings jar so we can plan the huge end of summer reunion. Love you block, talk soon!'
      }
    ],
    updatedAt: '2026-05-22T14:15:00Z',
    unreadBy: ['mateo'] // Mateo needs to reply or listen in!
  },
  {
    id: 'vc2',
    title: 'Laura + Mateo: Summer Plans ☀️',
    participants: ['mateo', 'laura'],
    messages: [
      {
        id: 'vm4',
        senderId: 'laura',
        duration: 45,
        timestamp: '2026-05-19T09:00:00Z',
        audioUrl: 'simulated_audio_laura_plans',
        transcript: 'Hi Mateo, just brainstorming Spain updates! Let me know if you can take some days off in July. We should definitely go to the countryside.'
      },
      {
        id: 'vm5',
        senderId: 'mateo',
        duration: 110,
        timestamp: '2026-05-19T13:40:00Z',
        audioUrl: 'simulated_audio_mateo_plans',
        transcript: 'Oh absolutely! Vacation days are approved by my team. Let us secure the flight jar targets so we can buy cheap tickets. Excited for this!'
      }
    ],
    updatedAt: '2026-05-19T13:40:00Z',
    unreadBy: []
  }
];

// Initial shared journey savings funds (Visit Funds)
export const INITIAL_FUNDS: VisitFund[] = [
  {
    id: 'vf1',
    name: 'Brother and Sister Reunion SF',
    destinationCity: 'San Francisco',
    targetAmount: 2000,
    currentAmount: 1550, // 77.5% - Let's celebrate!
    participants: ['mateo', 'david'],
    flightStatus: {
      originCity: 'Boston/Tokyo',
      currentPrice: 870,
      targetPrice: 900,
      trend: 'down', // Fare watchdog ping alert!
      lastChecked: '2026-05-23T20:00:00Z'
    },
    milestones: [
      { percentage: 25, title: 'Flight booked conceptual', unlocked: true, momentMsg: '🎉 Start looking at flights!' },
      { percentage: 50, title: 'Halfway there celebration', unlocked: true, momentMsg: '🚀 Hotel deposit secured' },
      { percentage: 75, title: 'Golden Gate Dreaming', unlocked: true, momentMsg: '🍻 Golden Gate Bridge plans set' },
      { percentage: 100, title: 'Takeoff Checklist', unlocked: false, momentMsg: '✈️ Tickets ordered!' }
    ],
    itinerary: [
      'Day 1: Landing, clam chowder at Fisherman\'s Wharf',
      'Day 2: Early morning cycle across Golden Gate Bridge to Sausalito',
      'Day 3: Redwood hike in Muir Woods, sunset bonfire',
      'Day 4: SF MoMA and fine sourdough feast at Tartine'
    ],
    packingList: [
      { item: 'Light rain windbreaker', packed: true, assignedId: 'david' },
      { item: 'Hiking boots', packed: false, assignedId: 'mateo' },
      { item: 'Camera charging brick', packed: true, assignedId: 'mateo' },
      { item: 'Power adapters', packed: false, assignedId: 'david' }
    ]
  },
  {
    id: 'vf2',
    name: 'Nonna to Barcelona 2026',
    destinationCity: 'Barcelona',
    targetAmount: 800,
    currentAmount: 320, // 40% - Halfway to 50%
    participants: ['laura', 'nonna', 'mateo'],
    flightStatus: {
      originCity: 'Rome',
      currentPrice: 110,
      targetPrice: 95,
      trend: 'stable',
      lastChecked: '2026-05-23T18:00:00Z'
    },
    milestones: [
      { percentage: 25, title: 'Tickets Fund Ready', unlocked: true, momentMsg: '🎉 Rome to BCN budget ready!' },
      { percentage: 50, title: 'Apartment Deposit', unlocked: false, momentMsg: '🏡 Cozy flat in Gracia' },
      { percentage: 75, title: 'Tapas & Sangria Fund', unlocked: false },
      { percentage: 100, title: 'Touchdown!', unlocked: false }
    ],
    itinerary: [
      'Day 1: Nonna arrives! Leisurely walk in Parc Ciutadella',
      'Day 2: Sagrada Familia visits, slow lunch (Paella day)',
      'Day 3: Kitchen cooking night at Laura\'s apartment'
    ],
    packingList: [
      { item: 'Comfortable walking shoes', packed: false, assignedId: 'nonna' },
      { item: 'Nonna\'s personal spice tins', packed: true, assignedId: 'nonna' },
      { item: 'Sun hat', packed: false, assignedId: 'laura' }
    ]
  }
];

// Family holidays / Calendar events for matching context (tap on pin)
export function getUpcomingHolidays(city: string) {
  switch (city) {
    case 'Rome':
      return [
        { date: 'June 2', name: 'Festa della Repubblica (Italian Republic Day)', info: 'National parade, some closures.' },
        { date: 'June 29', name: 'Feast of Saints Peter and Paul', info: 'Local Rome holiday.' }
      ];
    case 'Barcelona':
      return [
        { date: 'June 24', name: 'Sant Joan (Feast of St. John)', info: 'Spectacular beach bonfires and coca pastries all night.' },
        { date: 'August 15', name: 'Festival of Gràcia', info: 'Beautifully decorated backstreets in Gràcia neighborhood.' }
      ];
    case 'Boston':
      return [
        { date: 'May 25', name: 'Memorial Day weekend', info: 'Traditional start of coastal New England summer.' },
        { date: 'July 4', name: 'Independence Day', info: 'Historic Charles River fireworks.' }
      ];
    case 'Tokyo':
      return [
        { date: 'July 20', name: 'Marine Day (Umi no Hi)', info: 'Beach openings and summer festivals begin.' },
        { date: 'August 13-16', name: 'Obon Week', info: 'Lantern lighting and ancestral family sweeps.' }
      ];
    default:
      return [];
  }
}

// Simulated local real-time weather generator
export function getLocalWeather(city: string) {
  switch (city) {
    case 'Rome':
      return { temp: '22°C', icon: 'Sun', summary: 'Sunny afternoon with light breeze' };
    case 'Barcelona':
      return { temp: '19°C', icon: 'CloudSun', summary: 'Mild coastal twilight, high humidity' };
    case 'Boston':
      return { temp: '14°C', icon: 'CloudRain', summary: 'Crisp New England morning fog' };
    case 'Tokyo':
      return { temp: '26°C', icon: 'Sun', summary: 'Warm morning sun, beautiful spring day' };
    default:
      return { temp: '20°C', icon: 'Compass', summary: 'Perfect clear skies' };
  }
}
