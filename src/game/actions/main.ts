import { ButtonInteraction, Client, EmbedBuilder } from 'discord.js'
import { getTrooper } from '../../provider/mongodb'
import { mainMenu } from './common/buttons'
import { getTimeRemainingString, toTitleCase, updateLeaderboardMessage } from '../utilities'

export async function handleMain(interaction: ButtonInteraction, roundEndTime: Date, discordClient: Client) {
  const userId = interaction.user.id
  const trooper = await getTrooper(userId)
  const timeRemainingString = getTimeRemainingString(roundEndTime)
  await updateLeaderboardMessage(discordClient)

  if (!trooper) {
    await interaction.editReply("It seems you haven't started your journey yet!")
    return
  }

  const avatarUrl = interaction.user.displayAvatarURL()

  const embed = new EmbedBuilder()
    .setTitle('🪖 Mezo Trooper Status')
    .setDescription(
      'As a dedicated **Mezo Trooper**, you stand on the front lines, ready to defend the **Mezo Ecosystem** from all threats.\n\n ' +
        'Stay vigilant, and push forward to conquer new territories and earn your place among the legendary defenders of Mezo.\n\n',
    )
    .addFields(
      { name: 'Points', value: `✨ ${trooper.points}`, inline: true },
      { name: 'Current Territory', value: `🪐 ${toTitleCase(trooper.currentTerritory)}`, inline: true },
      { name: 'Mats Earned', value: `🪙 ${trooper.matsEarnedInGame || 0}`, inline: true },
      { name: 'Next Round In', value: `⌛ ${timeRemainingString}`, inline: false },
    )
    .setColor(0xff494a)
    .setThumbnail(avatarUrl)

  await interaction.update({
    content: '',
    embeds: [embed],
    components: [mainMenu()],
  })
}
