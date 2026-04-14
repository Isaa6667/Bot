const express = require("express");
const fetch = require("node-fetch");
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const app = express();
app.use(express.json());

// ===============================
// CONFIG (TOKEN HARDCODED)
// ===============================
const TOKEN = "MTQwODc0OTg5NDE5MzM4MTQxOA.Gyx_G5.ajKkDDhW9XqEu6lYl1Wpfy-gcpyRRFlTJR1KHA";
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

// ===============================
// DISCORD CLIENT
// ===============================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log(`Bot online as ${client.user.tag}`);
});

// ===============================
// RECEIVE REPORT FROM API
// ===============================
app.post("/sendReport", async (req, res) => {
    try {
        const { reporter, reported, reason } = req.body;

        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle("New Report")
            .addFields(
                { name: "Reporter", value: reporter || "Unknown", inline: true },
                { name: "Reported", value: reported || "Unknown", inline: true },
                { name: "Reason", value: reason || "None" }
            )
            .setColor(0xff0000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`warn:${reported}`).setLabel("Warn").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`kick:${reported}`).setLabel("Kick").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ban:${reported}`).setLabel("Ban").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`approve:${reported}`).setLabel("Approve").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`deny:${reported}`).setLabel("Deny").setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        res.json({ success: true });

    } catch (err) {
        console.error("[sendReport error]", err);
        res.status(500).json({ error: "failed to send report" });
    }
});

// ===============================
// BUTTON HANDLER
// ===============================
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const [action, target] = interaction.customId.split(":");

    await interaction.reply({
        content: `Action selected: ${action} → ${target}`,
        ephemeral: true
    });

    try {
        await fetch(`${API_URL}/pushAction`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": API_KEY
            },
            body: JSON.stringify({
                action,
                target,
                moderator: interaction.user.tag
            })
        });
    } catch (err) {
        console.error("[pushAction error]", err);
    }
});

// ===============================
// START SERVER (RENDER PORT)
// ===============================
app.listen(process.env.PORT, () => {
    console.log("Bot HTTP server running on port " + process.env.PORT);
});

// ===============================
// LOGIN DISCORD BOT
// ===============================
client.login(TOKEN);
