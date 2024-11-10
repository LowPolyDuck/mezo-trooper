import { territories } from '../constants'

export function getFallbackTerritory(currentTerritory: string): string {
  const territoryOrder = [
    territories.CAMP_SATOSHI,
    territories.MATS_FARMING_BASE,
    territories.MEZO_COMMAND,
    territories.BITCOINFI_FRONTIER,
  ]
  const currentIndex = territoryOrder.indexOf(currentTerritory)
  return currentIndex > 0 ? territoryOrder[currentIndex - 1] : territories.CAMP_SATOSHI
}
