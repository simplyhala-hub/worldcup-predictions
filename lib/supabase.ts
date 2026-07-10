import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon)

export type Match = {
  id: string
  match_date: string
  kickoff_at: string
  stage: string
  home_team: string
  away_team: string
  allow_draw: boolean
  result: 'home' | 'draw' | 'away' | null
  next_match_id: string | null
  next_slot: 'home' | 'away' | null
  loser_next_match_id: string | null
  loser_next_slot: 'home' | 'away' | null
}
export type Player = { id: string; name: string; created_at: string }
export type Prediction = { id: string; user_id: string; match_id: string; pick: 'home'|'draw'|'away'; created_at: string }
