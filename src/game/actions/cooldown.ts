import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder,CommandInteraction } from 'discord.js'


export async function handleCooldown(interaction: CommandInteraction | ButtonInteraction, cooldownEndTime: number) {
    console.log('--- handleCooldown START ---');

    
 // Defer the interaction appropriately
 if (interaction instanceof ButtonInteraction) {
    if (!interaction.deferred) {
      await interaction.deferUpdate();
    }
  } else if (interaction instanceof CommandInteraction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
  }
    const timeRemaining = Math.floor(cooldownEndTime / 1000); // Convert to seconds for timestamp
    const cooldownEmbed = new EmbedBuilder()
      .setTitle('🛌 You’re on R&R!')
      .setDescription(`You're on cooldown! You'll be back in action soon.\n\n**Cooldown Ends:** <t:${timeRemaining}:R>`)
      .setColor(0x3498db)
      .setImage('https://gifs.cackhanded.net/starship-troopers/kiss.gif');
  
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('main').setLabel('Main Menu').setStyle(ButtonStyle.Primary)
    );
  
    try {
      await interaction.editReply({
        embeds: [cooldownEmbed],
        components: [actionRow],
      });
    } catch (error) {
      console.error('Error in handleCooldown:', error);
      if (!interaction.replied) {
        await interaction.followUp({
          content: 'Something went wrong while showing the cooldown. Please try again.',
          ephemeral: true,
        });
      }
    }
  
    console.log('--- handleCooldown END ---');
  }
  
  export function checkCooldown(
    userId: string,
    cooldowns: Map<string, number>,
    skipCheck = false // Allow skipping cooldown checks
  ): { isOnCooldown: boolean; cooldownEndTime: number } {
    if (skipCheck) {
      return { isOnCooldown: false, cooldownEndTime: 0 }; // Skip cooldown check
    }
  
    const now = Date.now();
    const cooldownEndTime = cooldowns.get(userId) || 0;
  
    return {
      isOnCooldown: cooldownEndTime > now,
      cooldownEndTime,
    };
  }
  