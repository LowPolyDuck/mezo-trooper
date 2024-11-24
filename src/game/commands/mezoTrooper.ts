import { CommandInteraction, ButtonInteraction, EmbedBuilder } from 'discord.js'
import { mainMenu } from '../actions/common/buttons'

export async function handleMezoTrooperCommand(interaction: CommandInteraction | ButtonInteraction) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle('Welcome to Mezo Troopers')
    .setDescription(
      'The battle for **BitcoinFi** begins! ' +
        'Choose your actions wisely to protect the **Mezo Ecosystem** from the ruthless Fiat Bug Empire.\n\n' +
        'Stand strong, strategize, and fight to ensure the survival and prosperity of the Mezo realm.\n\n' +
        'Every decision counts—your journey awaits!',
    )

    .setColor(0xff494a)
    .setImage(`https://raw.githubusercontent.com/ethboi/assets1/refs/heads/main/mezo-trooper.jpg`)

  await interaction.reply({
    embeds: [welcomeEmbed],
    content: '',
    components: [mainMenu()],
    ephemeral: true,
  })
}
