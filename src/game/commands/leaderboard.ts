import { CommandInteraction } from 'discord.js'
import { MATS_AWARDS } from '../constants'
import { getNextRoundEndTime } from '../utilities'
import { updateAndFetchRanks } from '../../provider/mongodb'
import { pointsManager } from '../../dripApi/pointsManager'

export async function handleLeaderboardCommand(interaction: CommandInteraction) {
  try {
    await interaction.deferReply()
    const roundEndTime: Date = getNextRoundEndTime()
    const rankedPlayers = await updateAndFetchRanks()
    const roundEndTimestamp = Math.floor(roundEndTime.getTime() / 1000) // Unix timestamp for countdown
    let leaderboardMessage = `Leaderboard:\nTime until next round: <t:${roundEndTimestamp}:R>\n`
    for (const [index, player] of rankedPlayers.slice(0, 10).entries()) {
      try {
        const userBalance = await pointsManager.getBalance(player.userId)
        leaderboardMessage += `${index + 1}. Mezo Trooper <@${player.userId}> - Points: ${player.points}  \n`

        // Add mats awards for top 3 players
        if (index < MATS_AWARDS.length) {
          leaderboardMessage += `    🏆 Reward: ${MATS_AWARDS[index]} mats if position holds 🏆\n`
        }
      } catch (error) {
        leaderboardMessage += `${index + 1}. Mezo Trooper <@${player.userId}> - Points: ${player.points}\n`
      }
    }
    await interaction.editReply(leaderboardMessage)
  } catch (error) {
    console.error('Error handling leaderboard command:', error)
    await interaction
      .followUp({
        content: 'There was an error processing the leaderboard command.',
        ephemeral: true,
      })
      .catch(console.error)
  }
}
