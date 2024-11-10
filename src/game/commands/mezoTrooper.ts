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
    .setThumbnail(
      'https://styles.redditmedia.com/t5_2u091/styles/communityIcon_ry3hant7cfq61.jpg?format=pjpg&s=8e91bf21dd61485a8544614621364c320f952602',
    )
    .setColor(0xff494a)

  await interaction.reply({
    embeds: [welcomeEmbed],
    content: '',
    components: [mainMenu()],
  })
}
