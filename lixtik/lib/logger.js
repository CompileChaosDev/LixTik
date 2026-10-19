const axios = require('axios')
const { buildReport } = require('./report')
const config = require('./config')

const DISCORD_API = 'https://discord.com/api/v10'

async function sendToDiscord(report) {
  const { DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID } = process.env
  const webhookUrl = config.discordWebhookUrl
  const payload = { content: '```\n' + report + '\n```' }

  if (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID) {
    await axios.post(`${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages`, payload, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      timeout: 3000
    })
    return
  }

  if (webhookUrl) {
    await axios.post(webhookUrl, { ...payload, username: 'LixTik API Logger' }, { timeout: 3000 })
  }
}

async function logRequest(info) {
  try {
    await sendToDiscord(buildReport(info))
  } catch (err) {
    return
  }
}

module.exports = { logRequest }
