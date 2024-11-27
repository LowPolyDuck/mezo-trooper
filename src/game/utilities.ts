import { Client, EmbedBuilder, TextChannel, userMention } from 'discord.js'
import { getLeaderBoard, incrementMatsInGame, resetPlayersToDefaults } from '../provider/mongodb'
import { MATS_AWARDS } from './constants'
import { LOG_CHANNEL_ID } from '../config/config'
import { pointsManager } from '../dripApi/pointsManager'
import { activeGames } from './constants'
import { GAME_CHANNEL_ID } from '../config/config'

export function getNextRoundEndTime(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  now.setUTCDate(now.getUTCDate() + 1)
  return now
}

let lastLeaderboardMessageId: string | null = null // Track the last leaderboard message ID

export async function updateLeaderboardMessage(client: Client) {
  try {
    const leaderboard = await getLeaderBoard()
    const roundEndTime: Date = getNextRoundEndTime()
    const roundEndTimestamp = Math.floor(roundEndTime.getTime() / 1000)

    if (!leaderboard || leaderboard.length === 0) {
      console.log('No leaderboard data available.')
      return
    }

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle('🏆 Mezo Trooper - Leaderboard')
      .setDescription(
        `Earn daily mats by participating in Mezo Trooper! 🛡️\nTop 3 earn extra rewards and defend Mezo against the Fiat Bug Empire! 🐞\n\nTime until next round: <t:${roundEndTimestamp}:R>`,
      )
      .setColor(0xffd700)

    leaderboard.forEach((entry, index) => {
      const rankAndUser = `#${index + 1}. ${userMention(entry.userId)}`
      const points = `${entry.points} points`
      const award = index < MATS_AWARDS.length ? ` 🪙 ${MATS_AWARDS[index]} mats` : ''

      leaderboardEmbed.addFields(
        { name: 'Rank & User', value: `${rankAndUser}`, inline: true },
        { name: 'Points', value: `${points}`, inline: true },
        { name: 'Award', value: `${award}`, inline: true },
      )
    })

    console.log('fetching ' + GAME_CHANNEL_ID)
    const channel = await client.channels.fetch(GAME_CHANNEL_ID)

    if (!channel?.isTextBased()) {
      console.log('Game channel is not text-based or could not be found.')
      return
    }
    const textChannel = channel as TextChannel
    let messageToUpdate

    if (lastLeaderboardMessageId) {
      try {
        messageToUpdate = await textChannel.messages.fetch(lastLeaderboardMessageId)
      } catch {
        console.log('Could not fetch the last leaderboard message.')
      }
    }
    if (!messageToUpdate) {
      try {
        const messages = await textChannel.messages.fetch({ limit: 1 })
        if (messages.size > 0) {
          messageToUpdate = messages.first()
        }
      } catch {
        console.log('Could not fetch the first message in the channel.')
      }
    }
    if (messageToUpdate) {
      try {
        await messageToUpdate.edit({ embeds: [leaderboardEmbed] })
        lastLeaderboardMessageId = messageToUpdate.id
        console.log('Updated the leaderboard message.')
      } catch (error) {
        console.error('Failed to update the leaderboard message:', error)
      }
      return
    }
    // Send a new leaderboard message if no existing one is found
    const newMessage = await textChannel.send({ embeds: [leaderboardEmbed] })
    lastLeaderboardMessageId = newMessage.id // Track the new message ID
    console.log('Sent a new leaderboard message and updated the tracker.')
  } catch (error) {
    console.error('Failed to update leaderboard message:', error)
  }
}

export function getTimeRemainingString(roundEndTime: Date): string {
  const now = new Date()
  const timeRemaining = Math.max(roundEndTime.getTime() - now.getTime(), 0)
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours} hours, ${minutes} minutes`
}

export async function endRound(
  pastLeaderboards: Array<{ date: string; leaderboard: string }>,
  guildId: string,
  userId: string,
) {
  // Placeholder function to handle end of round operations
  console.log('Round ended, awarding mats...')
  const leaderboard = await getLeaderBoard()

  if (leaderboard.length > 0) {
    const topPlayers = leaderboard.slice(0, 10)
    for (const [index, player] of topPlayers.entries()) {
      const matsAwarded = MATS_AWARDS[index]

      // Award Mats via Drip API
      await pointsManager.addPoints(player.userId, matsAwarded)
      console.log(`Awarded ${matsAwarded} mats to ${player.userId}`)

      await incrementMatsInGame(player.userId, matsAwarded)
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
  // Reset points and Territory for all players and log the action
  await resetPlayersToDefaults();

  console.log('All players have been reset to default state for the new round.');

  const userGameKey = `${guildId}-${userId}`
  activeGames.delete(userGameKey) // Clear the specific user’s game instance
  console.log(`Game instance cleared for user ${userId} in guild ${guildId}.`)
}

export function addMillisecondsToDate(inputDate: Date, millisecondsToAdd: number): Date {
  const currentTimestamp = inputDate.getTime()
  const newTimestamp = currentTimestamp + millisecondsToAdd
  const newDate = new Date(newTimestamp)
  return newDate
}

export type CustomId = 'blaster' | 'cannon' | 'fist' | 'dagger' | 'build_wall' | 'set_trap' | 'supply_run' | 'snacking'

const labelDictionary: Record<CustomId, string> = {
  blaster: 'Bitcoin Blaster',
  cannon: 'Mezo Cannon',
  fist: 'Defi Fist',
  dagger: 'HODL Dagger',
  build_wall: 'BTCFi Wall',
  set_trap: 'Mezo Trap',
  supply_run: 'Drip Supplies',
  snacking: 'Mats Snack',
}

export function getLabelByCustomId(customId: CustomId): string {
  return labelDictionary[customId] || 'Label not found'
}

export async function logPlayerDeath(
  client: Client,
  userId: string,
  points: number,
  territory: string,
  itemUsed: string,
  powerLevel: number,
  avatarUrl: string,
) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID)
    if (!channel?.isTextBased()) {
      console.log('Message channel is not text-based or could not be found.')
      return
    }

    const textChannel = channel as TextChannel
    const formattedTerritory = `${toTitleCase(territory)}`
    const formattedItemUsed = `${toTitleCase(itemUsed)}`

    const embed = new EmbedBuilder()
      .setTitle('💀 Player Death Log')
      .setDescription(`${userMention(userId)} has fallen in the line of duty.`)
      .addFields(
        { name: '✨ Points at Death', value: `> ${points}`, inline: false },
        { name: '🪐 Territory', value: `> ${formattedTerritory}`, inline: false },
        { name: '🛡️ Last Action', value: `> ${formattedItemUsed}`, inline: false },
        { name: '⚡ Power Level', value: `> ${powerLevel}`, inline: false },
      )
      .setColor(0xff0000)
      .setThumbnail(avatarUrl)
      .setTimestamp()

    await textChannel.send({ embeds: [embed] })
    console.log(`Logged death for user ${userId} in ${territory} with ${points} points.`)
  } catch (error) {
    console.error('Failed to log player death:', error)
  }
}

export function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}
