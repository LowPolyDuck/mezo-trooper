import { CommandInteraction } from 'discord.js'
import { getTrooper } from '../../provider/mongodb'
import { getTimeRemainingString } from '../utilities'

export async function handlePointsCommand(interaction: CommandInteraction, roundEndTime: Date) {
  await interaction.deferReply()
  const userId = interaction.user.id
  const trooper = await getTrooper(userId)
  const timeRemainingString = getTimeRemainingString(roundEndTime)

  if (!trooper) {
    await interaction.editReply("It seems you haven't started your journey yet!")
    return
  }

  const replyMessage = `**Your Mezo Trooper:**\n- Points: ${trooper.points}\n- Current Territory: ${trooper.currentTerritory}\n- Time until next round: ${timeRemainingString}`
  await interaction.editReply(replyMessage)
}
