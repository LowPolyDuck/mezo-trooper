import { REST, Routes } from 'discord.js'
import { CLIENT_ID, GUILD_ID, TOKEN } from './src/config/config'

const commands = [
  {
    name: 'mezo_trooper',
    description: "What's it gonna be trooper, attack the enemy, defend or travel to the frontline!?",
  },
]
const rest = new REST({ version: '9' }).setToken(TOKEN)

;(async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    })

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
})()
