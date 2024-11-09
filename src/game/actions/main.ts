import { ButtonInteraction, EmbedBuilder } from 'discord.js'
import { getTrooper } from '../../provider/mongodb'
import { mainMenu } from './common/buttons'
import { getTimeRemainingString } from '../utilities'

export async function handleMain(interaction: ButtonInteraction, roundEndTime: Date) {
  const userId = interaction.user.id
  const trooper = await getTrooper(userId)
  const timeRemainingString = getTimeRemainingString(roundEndTime)

  if (!trooper) {
    await interaction.editReply("It seems you haven't started your journey yet!")
    return
  }

  const avatarUrl = interaction.user.displayAvatarURL()

  const embed = new EmbedBuilder()
    .setTitle('🪖 Mezo Trooper Status')
    .setDescription(
      'As a dedicated **Mezo Trooper**, you stand on the front lines, ready to defend the **Mezo ecosystem** from all threats.\n\n ' +
        'Stay vigilant, and push forward to conquer new territories and earn your place among the legendary defenders of Mezo.\n\n',
    )
    .addFields(
      { name: 'Points', value: `✨ ${trooper.points}`, inline: true },
      { name: 'Current Territory', value: `🪐 ${(toTitleCase(trooper.currentTerritory))}`, inline: true },
      { name: 'Next Round In', value: `⌛ ${timeRemainingString}`, inline: false },
    )
    .setColor(0xff494a)
    .setThumbnail(avatarUrl)

  await interaction.update({
    content: '', // Reset content to "Choose your action"
    embeds: [embed],
    components: [mainMenu()],
  })
}

// Helper function to convert string to title case
function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}
