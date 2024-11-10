import { ButtonInteraction, bold, Client, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'
import { insertOrUpdatePlayer } from '../../provider/mongodb'
import { Trooper, Outcome } from '../../types'
import { logPlayerDeath } from '../utilities'
import { getFallbackTerritory } from './territories'

export async function handleSpecialOutcome(
  interaction: ButtonInteraction,
  userChoice: string,
  trooper: Trooper,
  userId: string,
  powerLevel: number,
  itemUsed: string,
  avatarUrl: string,
  cooldowns: Map<string, number> = new Map(),
) {
  const outcomes: Record<string, Outcome> = {
    dagger: {
      message: `A dagger? where's your ${bold('Mezo')} BitcoinFi-Assault Rifle trooper?\n\n You are overrun, you ${bold(
        'DIED',
      )}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/pvgQeEnepkQAAAAd/killer-bugs-starship-troopers.gif',
    },
    snacking: {
      message: `Eating your mats soldier? ${bold(
        'Mezo Troopers',
      )}  run on adrenline & BitcoinFi weaponry only.\n\n Fiat bugs ambush you, you ${bold('DIED')}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/e-Ngztd2-lYAAAAC/starship-troopers-burn.gif',
    },
  }

  const outcome = outcomes[userChoice]
  const pointsBeforeReset = trooper.points

  // await logPlayerDeath(
  //   interaction.client as Client,
  //   userId,
  //   pointsBeforeReset,
  //   trooper.currentTerritory,
  //   itemUsed,
  //   powerLevel,
  //   avatarUrl,
  // )

  trooper.points = 0
  trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
  cooldowns.set(userId, Date.now() + 1000)

  await insertOrUpdatePlayer(trooper)

  const embed = new EmbedBuilder()
    .setTitle("You're the worst Mezo Trooper ever!") //
    .setDescription(outcome.message)
    .setImage(outcome.gifUrl)
    .setColor(0xffffff)

  const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}
