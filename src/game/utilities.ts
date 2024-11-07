import { Client, TextChannel, userMention } from 'discord.js'
import { getLeaderBoard } from '../provider/mongodb'
import { MATS_AWARDS } from './constants'
import { LEADERBOARD_CHANNEL_ID, MESSAGE_ID } from '../config/config'
import { pointsManager } from '../dripApi/pointsManager'

export function getNextRoundEndTime(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  now.setUTCDate(now.getUTCDate() + 1)
  return now
}

export async function updateLeaderboardMessage(client: Client) {
  const leaderboard = await getLeaderBoard()
  const roundEndTime: Date = getNextRoundEndTime()
  const roundEndTimestamp = Math.floor(roundEndTime.getTime() / 1000)

  if (!leaderboard) {
    console.log('No leaderboard data available.')
    return
  }

  const leaderboardStrings = await Promise.all(
    leaderboard.map(async (entry, index) => {
      let leaderboardEntry = `#${index + 1}. ${userMention(entry.userId)}: ${entry.points} points, current territory: ${
        entry.currentTerritory
      } `
      if (index < MATS_AWARDS.length) {
        leaderboardEntry += `    🏆 Reward: ${MATS_AWARDS[index]} mats if position holds 🏆`
      }

      return leaderboardEntry
    }),
  )

  const leaderboardMessage = `**Mezo Trooper - Leaderboard**\nTime until next round: <t:${roundEndTimestamp}:R>\n${leaderboardStrings.join(
    '\n',
  )}`

  const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID)

  if (channel?.isTextBased()) {
    const textChannel = channel as TextChannel

    try {
      const message = await textChannel.messages.fetch(MESSAGE_ID)
      await message.edit(`\n${leaderboardMessage}`)
    } catch (error) {
      console.log('Existing leaderboard message not found. Sending a new message.')
      await textChannel.send(`\n${leaderboardMessage}`)
    }
  } else {
    console.log('Leaderboard channel is not text-based or could not be found.')
  }
}

export function getTimeRemainingString(roundEndTime: Date): string {
  const now = new Date()
  const timeRemaining = Math.max(roundEndTime.getTime() - now.getTime(), 0)
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours} hours, ${minutes} minutes`
}

export async function endRound(pastLeaderboards: Array<{ date: string; leaderboard: string }>) {
  // Placeholder function to handle end of round operations
  console.log('Round ended, awarding mats...')
  const leaderboard = await getLeaderBoard()
  if (leaderboard.length > 0) {
    const topPlayers = leaderboard.slice(0, 3)
    for (const [index, player] of topPlayers.entries()) {
      await pointsManager.addPoints(player.userId, MATS_AWARDS[index])
    }
    // Store past leaderboard
    pastLeaderboards.unshift({
      date: new Date().toISOString(),
      leaderboard: leaderboard
        .map((entry, index) => `#${index + 1} ${userMention(entry.userId)} - ${entry.points} points`)
        .join('\n'),
    })
    if (pastLeaderboards.length > 3) pastLeaderboards.pop() // Keep only last 3 days
  }
}

export function addMillisecondsToDate(inputDate: Date, millisecondsToAdd: number): Date {
  const currentTimestamp = inputDate.getTime()
  const newTimestamp = currentTimestamp + millisecondsToAdd
  const newDate = new Date(newTimestamp)
  return newDate
}
