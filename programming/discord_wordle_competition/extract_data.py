import discord
import json
import aiohttp
import aiofiles
import logging

log = logging.getLogger(__name__)

TOKEN = "<TOKEN_HERE>"
CHANNEL_ID = 1205820713035104308  # spam channel

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'Logged in as {client.user}')
    channel = client.get_channel(CHANNEL_ID)

    if channel is None:
        print("Channel not found!")
        await client.close()
        return

    messages = []
    async for msg in channel.history(limit=None):
        log.info(f"Processing message: {msg.created_at.isoformat()}")
        images_urls = []
        if msg.created_at.isoformat() > "2025-06":
            print(msg.created_at.isoformat())
            for attachment in msg.attachments:
                if attachment.content_type and attachment.content_type.startswith("image/"):
                    images_urls.append(attachment.url)
                    await download_image(attachment.url, f"imgs/{msg.created_at.isoformat()}.png")

        messages.append({
            "author": msg.author.name,
            "author_nickname": msg.author.display_name,
            "author_id": msg.author.id,
            "content": msg.content.replace("\n", "\\n"),
            "timestamp": msg.created_at.isoformat(),
            "images_urls": images_urls
        })

    with open("discord_messages.json", "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(messages)} messages to discord_messages.json")
    await client.close()

async def download_image(url: str, filename: str):
    session = aiohttp.ClientSession()
    response = await session.get(url)
    log.info(f"Fetching image from {url}")
    response.raise_for_status()

    if response.status == 200:
        file = await aiofiles.open(filename, mode='wb')
        content = await response.read()
        await file.write(content)
        await file.close()

    await response.release()
    await session.close()


client.run(TOKEN)
