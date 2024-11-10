export interface Trooper {
  userId: string
  points: number
  currentTerritory: string
  matsEarnedInGame?: number; 
}

export type LeaderBoard = {
  userId: string
  points: number
  territory: string
}

export type Outcome = {
  message: string
  gifUrl: string
}
