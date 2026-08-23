export type Language = 'en' | 'da'

export const translations = {
  en: {
    discover: 'Discover',
    trips: 'Trips',
    chat: 'Chat',
    safety: 'Safety',
    market: 'Market',
    profile: 'Profile',
    travellers: 'Travellers',
    settings: 'Settings',
    language: 'Language',
    logout: 'Log Out',
    saveProfile: 'Save Profile',
    editProfile: 'Edit Profile',
    safetyHub: 'Safety Hub',
    searchDestination: 'Search any destination...',
    findYourCrew: 'Find Your Crew',
    noTripsYet: 'No trips yet',
    noChatsYet: 'No chats yet',
    upgrade: 'Upgrade',
    subscribe: 'Subscribe',
  },
  da: {
    discover: 'Opdag',
    trips: 'Rejser',
    chat: 'Chat',
    safety: 'Sikkerhed',
    market: 'Marked',
    profile: 'Profil',
    travellers: 'Rejsende',
    settings: 'Indstillinger',
    language: 'Sprog',
    logout: 'Log Ud',
    saveProfile: 'Gem Profil',
    editProfile: 'Rediger Profil',
    safetyHub: 'Sikkerhedshub',
    searchDestination: 'Søg efter destination...',
    findYourCrew: 'Find Dit Crew',
    noTripsYet: 'Ingen rejser endnu',
    noChatsYet: 'Ingen chats endnu',
    upgrade: 'Opgrader',
    subscribe: 'Abonner',
  },
}

export function t(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || translations.en[key]
}
