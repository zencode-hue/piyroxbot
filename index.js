const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  InteractionType,
} = require("discord.js");

const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const TYPES = {
  MANUAL: "manual",
  SUPPORT: "support",
  AFFILIATE: "affiliate",
};

const PANEL_CONFIG = {
  [TYPES.MANUAL]: {
    title: "Manual Purchase Ticket",
    description:
      "Can't find your desired payment method on our website? Click the button below to create a manual purchase ticket. Our team will assist you right away.",
    color: 0x00bfff,
    buttonLabel: "Create Manual Purchase Ticket",
    buttonId: "manual_ticket_button",
    modalId: "manual_ticket_modal",
    buttonEmoji: "🛒",
  },
  [TYPES.SUPPORT]: {
    title: "Support & Enquiry",
    description:
      "Need help or have a question? Click the button below to open a support ticket and our team will assist you shortly.",
    color: 0x00ff7f,
    buttonLabel: "Create Support Ticket",
    buttonId: "support_ticket_button",
    modalId: "support_ticket_modal",
    buttonEmoji: "🎫",
  },
  [TYPES.AFFILIATE]: {
    title: "Affiliate Application",
    description:
      "Want to become a Piyrox affiliate marketer? Click the button below to submit your application and our team will review it.",
    color: 0xffa500,
    buttonLabel: "Apply for Affiliate",
    buttonId: "affiliate_ticket_button",
    modalId: "affiliate_ticket_modal",
    buttonEmoji: "🤝",
  },
};

const MODAL_FIELDS = {
  [TYPES.MANUAL]: [
    {
      customId: "product_name",
      label: "Product Name",
      placeholder: "e.g. Netflix Premium, Spotify Family",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "payment_method",
      label: "Preferred Payment Method",
      placeholder: "e.g. Crypto, PayPal, Bank Transfer",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "quantity",
      label: "Quantity",
      placeholder: "e.g. 1, 2, 3",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "additional_info",
      label: "Additional Information",
      placeholder: "Any extra details we should know...",
      style: TextInputStyle.Paragraph,
      required: false,
    },
  ],
  [TYPES.SUPPORT]: [
    {
      customId: "subject",
      label: "Subject",
      placeholder: "Brief summary of your issue or enquiry",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "description",
      label: "Description",
      placeholder: "Describe your issue or question in detail...",
      style: TextInputStyle.Paragraph,
      required: true,
    },
    {
      customId: "order_id",
      label: "Order ID (if applicable)",
      placeholder: "Leave blank if not related to an order",
      style: TextInputStyle.Short,
      required: false,
    },
  ],
  [TYPES.AFFILIATE]: [
    {
      customId: "full_name",
      label: "Full Name",
      placeholder: "Your full name",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "experience",
      label: "Experience / Marketing Strategy",
      placeholder: "Tell us about your marketing experience or strategy...",
      style: TextInputStyle.Paragraph,
      required: true,
    },
    {
      customId: "contact_info",
      label: "Contact Information",
      placeholder: "Email, Telegram, or preferred contact method",
      style: TextInputStyle.Short,
      required: true,
    },
    {
      customId: "reason",
      label: "Why do you want to join?",
      placeholder: "Explain why you want to become an affiliate...",
      style: TextInputStyle.Paragraph,
      required: true,
    },
  ],
};

const EMBED_FIELD_NAMES = {
  product_name: "Product Name",
  payment_method: "Payment Method",
  quantity: "Quantity",
  additional_info: "Additional Info",
  subject: "Subject",
  description: "Description",
  order_id: "Order ID",
  full_name: "Full Name",
  experience: "Experience / Strategy",
  contact_info: "Contact Info",
  reason: "Reason to Join",
};

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
  if (!message.guild) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const isAdmin =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.permissions.has(PermissionsBitField.Flags.ManageGuild);

  const validCommands = ["manual", "support", "affiliate"];
  if (!validCommands.includes(command)) return;

  if (!isAdmin) {
    return message.reply({
      content: "❌ You do not have permission to use this command.",
      allowedMentions: { repliedUser: false },
    });
  }

  const type = command;
  const panel = PANEL_CONFIG[type];

  const embed = new EmbedBuilder()
    .setTitle(panel.title)
    .setDescription(panel.description)
    .setColor(panel.color)
    .setFooter({ text: "Piyrox Marketplace" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(panel.buttonId)
      .setLabel(panel.buttonLabel)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(panel.buttonEmoji)
  );

  try {
    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  } catch (err) {
    console.error(err);
    message.reply({
      content: "❌ Failed to send panel.",
      allowedMentions: { repliedUser: false },
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const type = Object.values(TYPES).find((t) =>
      interaction.customId.startsWith(`${t}_ticket_button`)
    );
    if (!type) return;

    const fields = MODAL_FIELDS[type];
    const modal = new ModalBuilder()
      .setCustomId(`${type}_ticket_modal`)
      .setTitle(
        type === TYPES.MANUAL
          ? "Manual Purchase"
          : type === TYPES.SUPPORT
          ? "Support Request"
          : "Affiliate Application"
      );

    const rows = fields.map((field) =>
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(field.customId)
          .setLabel(field.label)
          .setPlaceholder(field.placeholder)
          .setStyle(field.style)
          .setRequired(field.required)
      )
    );

    modal.addComponents(...rows);
    await interaction.showModal(modal);
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    const type = Object.values(TYPES).find((t) =>
      interaction.customId.startsWith(`${t}_ticket_modal`)
    );
    if (!type) return;

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;
    const user = interaction.user;
    const fields = MODAL_FIELDS[type];

    const ticketNumber = Date.now().toString(36).toUpperCase();

    const ticketEmbed = new EmbedBuilder()
      .setTitle(
        `${PANEL_CONFIG[type].buttonEmoji} ${PANEL_CONFIG[type].title} — #${ticketNumber}`
      )
      .setDescription(`Ticket opened by ${user.toString()}`)
      .setColor(PANEL_CONFIG[type].color)
      .setTimestamp();

    for (const field of fields) {
      const value = interaction.fields.getTextInputValue(field.customId) || "N/A";
      ticketEmbed.addFields({
        name: EMBED_FIELD_NAMES[field.customId] || field.label,
        value: value.substring(0, 1024),
      });
    }

    const staffMention = `<@&${config.staffRoleId}>`;
    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${ticketNumber}`)
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    try {
      const channel = await guild.channels.create({
        name: `${type}-ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
          {
            id: config.staffRoleId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
            ],
          },
        ],
      });

      await channel.send({
        content: `${staffMention} — New ${type} ticket from ${user.toString()}`,
        embeds: [ticketEmbed],
        components: [closeRow],
      });

      await interaction.editReply({
        content: `✅ Your ${type} ticket has been created: ${channel.toString()}`,
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: "❌ Failed to create ticket. Please check bot permissions and configuration.",
      });
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("close_ticket_")) return;

  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const member = interaction.member;
  const isStaff = member.roles.cache.has(config.staffRoleId);
  const isTicketOwner =
    channel.permissionOverwrites.cache.get(member.id)?.allow.has(
      PermissionsBitField.Flags.ViewChannel
    ) ?? false;

  if (!isStaff && !isTicketOwner) {
    return interaction.reply({
      content: "❌ You do not have permission to close this ticket.",
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: "🔒 Closing this ticket in 5 seconds...",
  });

  setTimeout(async () => {
    try {
      await channel.delete();
    } catch (err) {
      console.error("Failed to delete ticket channel:", err);
    }
  }, 5000);
});

client.login(config.token).catch((err) => {
  console.error("Failed to login:", err.message);
  process.exit(1);
});
