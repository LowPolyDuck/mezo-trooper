import { ButtonInteraction, Client, EmbedBuilder } from 'discord.js'
import { getTrooper, getLeaderBoard } from '../../provider/mongodb'
import { mainMenu } from './common/buttons'
import { getTimeRemainingString, toTitleCase, updateLeaderboardMessage } from '../utilities'

export async function handleMain(interaction: ButtonInteraction, roundEndTime: Date, discordClient: Client) {
  if (!interaction.deferred) {
    await interaction.deferUpdate()
  }
  const userId = interaction.user.id
  const trooper = await getTrooper(userId)
  const timeRemainingString = getTimeRemainingString(roundEndTime)
  await updateLeaderboardMessage(discordClient)

  if (!trooper) {
    await interaction.editReply("It seems you haven't started your journey yet!")
    return
  }

  const avatarUrl = interaction.user.displayAvatarURL()

  // Fetch the leaderboard to determine the user's rank
  const leaderboard = await getLeaderBoard()
  const userRank = leaderboard.findIndex((entry) => entry.userId === userId) + 1 // Rank starts from 1

  const embed = new EmbedBuilder()
    .setTitle('🪖 Mezo Trooper Status')
    .setDescription(
      'As a dedicated **Mezo Trooper**, you stand on the front lines, ready to defend the **Mezo Ecosystem** from all threats.\n\n ' +
        'Stay vigilant, and push forward to conquer new territories and earn your place among the legendary defenders of Mezo.\n\n',
    )
    .addFields(
      { name: 'Rank', value: `> 🏅 ${userRank > 0 ? `#${userRank}` : 'Unranked'}`, inline: true },
      { name: 'Points', value: `> ✨ ${trooper.points}`, inline: true },
      { name: 'Current Territory', value: `> 🪐 ${toTitleCase(trooper.currentTerritory)}`, inline: true },
      { name: 'Mats Earned', value: `> 🪙 ${trooper.matsEarnedInGame || 0}`, inline: true },
      { name: 'Next Round In', value: `> ⌛ ${timeRemainingString}`, inline: false },
    )
    .setColor(0xff494a)
    .setThumbnail(avatarUrl)

  try {
    await interaction.editReply({
      content: '',
      embeds: [embed],
      components: [mainMenu()],
    })
  } catch (error) {
    console.error('Error in handleMain:', error)
    if (!interaction.replied) {
      await interaction.followUp({
        content: 'An error occurred while updating your status. Please try again.',
        ephemeral: true,
      })
    }
  }
}
