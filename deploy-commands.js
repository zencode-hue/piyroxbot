const { REST, Routes } = require("discord.js");
const config = require("./config.js");

const commands = [
  {
    name: "remind",
    description: "Remind a user to check their ticket channel.",
    options: [
      {
        name: "user",
        type: 6, // User type
        description: "The user to remind.",
        required: true,
      },
    ],
  },
  {
    name: "announce",
    description: "Make an announcement.",
    options: [
      {
        name: "message",
        type: 3, // String type
        description: "The message to announce.",
        required: true,
      },
      {
        name: "everyone",
        type: 5, // Boolean type
        description: "Whether to mention @everyone.",
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();