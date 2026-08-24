const PERSONALITY_COMPAT: Record<string, Record<string, number>> = {
  early_bird:   { early_bird: 100, planner: 80, spontaneous: 50, night_owl: 40 },
  night_owl:    { night_owl: 100, spontaneous: 80, early_bird: 40, planner: 40 },
  planner:      { planner: 100, early_bird: 80, spontaneous: 40, night_owl: 40 },
  spontaneous:  { spontaneous: 100, night_owl: 80, early_bird: 50, planner: 40 },
}

type MatchUser = {
  travel_vibes: string[] | null
  personality_tags: string | string[] | null
  verification_level?: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
}

function getPersonality(tags: string | string[] | null): string | null {
  if (!tags) return null
  return Array.isArray(tags) ? (tags[0] ?? null) : tags
}

export function calculateMatchScore(currentUser: MatchUser, otherUser: MatchUser): number {
  // 1. Travel vibes overlap (40 points)
  const myVibes = currentUser.travel_vibes ?? []
  const theirVibes = otherUser.travel_vibes ?? []
  const maxVibes = Math.max(myVibes.length, theirVibes.length, 1)
  const overlap = myVibes.filter(v => theirVibes.includes(v)).length
  const vibeScore = (overlap / maxVibes) * 40

  // 2. Personality compatibility (25 points)
  const myPersonality = getPersonality(currentUser.personality_tags)
  const theirPersonality = getPersonality(otherUser.personality_tags)
  let compatPct = 50
  if (myPersonality && theirPersonality) {
    compatPct = PERSONALITY_COMPAT[myPersonality]?.[theirPersonality] ?? 50
  }
  const personalityScore = compatPct * 0.25

  // 3. Verification status (20 points)
  const myVerified = currentUser.verification_level === 'ID_verified'
  const theirVerified = otherUser.verification_level === 'ID_verified'
  let verificationScore: number
  if (myVerified && theirVerified) verificationScore = 20
  else if (myVerified || theirVerified) verificationScore = 10
  else verificationScore = 5

  // 4. Profile completeness of the other user (15 points)
  const completedFields = [
    otherUser.avatar_url,
    otherUser.bio,
    (otherUser.travel_vibes ?? []).length > 0 ? true : null,
    getPersonality(otherUser.personality_tags),
    otherUser.city,
  ].filter(Boolean).length
  const completenessScore = (completedFields / 5) * 15

  const total = vibeScore + personalityScore + verificationScore + completenessScore
  return Math.min(99, Math.max(30, Math.round(total)))
}
