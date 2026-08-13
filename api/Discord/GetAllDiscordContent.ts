/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXX Environment Variables XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

// Discord Environment Variables
const DISCORD_API_BASE_URL: string | undefined = process.env.DISCORD_API_BASE_URL;
const DISCORD_BOT_TOKEN: string | undefined = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID: string | undefined = process.env.DISCORD_CHANNEL_ID; // The ID of the public channel to fetch messages from

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Props Interface XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

type IDiscordUser = {
    id: string;
    username: string;
    discriminator: string; // The # tag (deprecated, but often still returned)
    avatar: string | null;
};

export type IDiscordMessage = {
    id: string;
    content: string;
    timestamp: string;
    author: IDiscordUser;
    attachments: { url: string }[];
    embeds: unknown[]; // Keeping this as unknown array for simplicity
};

/* -----------------------------------------------------------------------------
XXXXXXXXXXXXXX Fetches recent messages from a Discord channel XXXXXXXXXXXXXXXXXX
----------------------------------------------------------------------------- */

/**
 * Fetches the most recent public messages from a Discord channel using a bot
 * token. Note: requires a Bot Token and the privileged MESSAGE_CONTENT intent
 * enabled for the bot in order to read message content on private messages.
 * @param limit Maximum number of messages to fetch.
 * @returns The channel's most recent messages, normalized to the
 * IDiscordMessage shape.
 */
export const getDiscordChannelMessages = async (limit: number = 10): Promise<IDiscordMessage[]> => {
    if (!DISCORD_API_BASE_URL || !DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
        throw new Error("Missing Discord environment variables (API_BASE_URL, BOT_TOKEN, or CHANNEL_ID).");
    }

    try {
        const url = `${DISCORD_API_BASE_URL}/channels/${DISCORD_CHANNEL_ID}/messages?limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            },
            next: { revalidate: 600 }, // Cache for 10 minutes
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Discord API Error (${response.status}): ${errorData?.message || 'Failed to fetch Discord messages.'}`);
        }

        const messages: IDiscordMessage[] = await response.json();
        
        // Map the raw data to ensure the IDiscordMessage type is strictly applied
        return messages.map((message) => ({
            id: message.id,
            content: message.content,
            timestamp: message.timestamp,
            author: message.author,
            attachments: message.attachments.map(a => ({ url: a.url })),
            embeds: message.embeds
        }));

    } catch (error) {
        console.error("Error fetching Discord messages:", error);
        throw new Error("Failed to retrieve Discord channel content.");
    }
};