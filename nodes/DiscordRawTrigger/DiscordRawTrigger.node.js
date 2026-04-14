const {
	Client,
	GatewayIntentBits,
	IntentsBitField,
	Partials,
} = require('discord.js');

const INTENT_OPTIONS = [
	{
		name: 'Guilds',
		value: 'Guilds',
		description: 'Required for most guild-scoped gateway events.',
	},
	{
		name: 'Guild Members',
		value: 'GuildMembers',
		description: 'Receive member join, leave, and update events.',
	},
	{
		name: 'Guild Moderation',
		value: 'GuildModeration',
		description: 'Receive moderation-related events such as bans.',
	},
	{
		name: 'Guild Expressions',
		value: 'GuildExpressions',
		description: 'Receive emoji, sticker, and soundboard updates.',
	},
	{
		name: 'Guild Integrations',
		value: 'GuildIntegrations',
		description: 'Receive integration and webhook updates.',
	},
	{
		name: 'Guild Webhooks',
		value: 'GuildWebhooks',
		description: 'Receive webhook update gateway events.',
	},
	{
		name: 'Guild Invites',
		value: 'GuildInvites',
		description: 'Receive invite create and delete events.',
	},
	{
		name: 'Guild Voice States',
		value: 'GuildVoiceStates',
		description: 'Receive voice state updates.',
	},
	{
		name: 'Guild Presences',
		value: 'GuildPresences',
		description: 'Receive member presence updates.',
	},
	{
		name: 'Guild Messages',
		value: 'GuildMessages',
		description: 'Receive message events from guild channels.',
	},
	{
		name: 'Guild Message Reactions',
		value: 'GuildMessageReactions',
		description: 'Receive reaction events from guild messages.',
	},
	{
		name: 'Guild Message Typing',
		value: 'GuildMessageTyping',
		description: 'Receive typing indicators from guild channels.',
	},
	{
		name: 'Direct Messages',
		value: 'DirectMessages',
		description: 'Receive message events from direct messages.',
	},
	{
		name: 'Direct Message Reactions',
		value: 'DirectMessageReactions',
		description: 'Receive reaction events from direct messages.',
	},
	{
		name: 'Direct Message Typing',
		value: 'DirectMessageTyping',
		description: 'Receive typing indicators from direct messages.',
	},
	{
		name: 'Message Content',
		value: 'MessageContent',
		description: 'Receive message content for eligible bots.',
	},
];

function parseEventNames(value) {
	return String(value || '')
		.split(',')
		.map((entry) => entry.trim().toUpperCase())
		.filter(Boolean);
}

function resolveIntentBits(selectedIntents) {
	if (!Array.isArray(selectedIntents) || selectedIntents.length === 0) {
		return [GatewayIntentBits.Guilds];
	}

	return selectedIntents
		.map((intentName) => GatewayIntentBits[intentName])
		.filter((intentBit) => typeof intentBit === 'number');
}

class DiscordRawTrigger {
	description = {
		displayName: 'Discord Raw Trigger',
		name: 'discordRawTrigger',
		icon: 'file:icon.png',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Discord gateway RAW events are received',
		defaults: {
			name: 'Discord Raw Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'discordBotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Gateway Intents',
				name: 'intents',
				type: 'multiOptions',
				options: INTENT_OPTIONS,
				default: ['Guilds'],
				description: 'Select the intents required for the RAW events you want Discord to send',
			},
			{
				displayName: 'Event Names',
				name: 'eventNames',
				type: 'string',
				default: '',
				placeholder: 'MESSAGE_CREATE, MESSAGE_UPDATE',
				description:
					'Optional comma-separated raw event names to emit. Leave empty to emit all dispatch events',
			},
			{
				displayName: 'Include Non-Dispatch Packets',
				name: 'includeNonDispatch',
				type: 'boolean',
				default: false,
				description:
					'Whether to emit packets without an event name, such as heartbeat acknowledgements',
			},
			{
				displayName: 'Emit Client Lifecycle Events',
				name: 'emitLifecycleEvents',
				type: 'boolean',
				default: false,
				description:
					'Whether to emit `ready`, `invalidated`, `warn`, and `error` events as workflow items',
			},
		],
	};

	async trigger() {
		const credentials = await this.getCredentials('discordBotApi');
		const botToken = credentials.botToken;
		const selectedIntents = this.getNodeParameter('intents', 0, []);
		const eventNames = parseEventNames(this.getNodeParameter('eventNames', 0, ''));
		const includeNonDispatch = this.getNodeParameter('includeNonDispatch', 0, false);
		const emitLifecycleEvents = this.getNodeParameter('emitLifecycleEvents', 0, false);

		if (!botToken) {
			throw new Error('No se encontro el Bot Token en la credencial Discord Bot API.');
		}

		const allowedEventNames = new Set(eventNames);
		const intentBits = resolveIntentBits(selectedIntents);
		const client = new Client({
			intents: new IntentsBitField(intentBits),
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.Message,
				Partials.Reaction,
				Partials.User,
			],
		});

		const emitItem = async (payload) => {
			try {
				await this.emit([this.helpers.returnJsonArray([payload])]);
			} catch (error) {
				// Prevent event handlers from crashing the Discord client loop.
				console.error('Failed to emit Discord RAW payload to n8n:', error);
			}
		};

		const onRaw = async (packet) => {
			const eventName = packet && packet.t ? String(packet.t).toUpperCase() : '';

			if (!includeNonDispatch && !eventName) {
				return;
			}

			if (allowedEventNames.size > 0 && !allowedEventNames.has(eventName)) {
				return;
			}

			await emitItem({
				source: 'discord.gateway.raw',
				receivedAt: new Date().toISOString(),
				eventName: eventName || null,
				opcode: packet.op,
				sequence: packet.s ?? null,
				data: packet.d ?? null,
			});
		};

		const onReady = async () => {
			if (!emitLifecycleEvents) {
				return;
			}

			await emitItem({
				source: 'discord.client.ready',
				receivedAt: new Date().toISOString(),
				userTag: client.user ? client.user.tag : null,
				userId: client.user ? client.user.id : null,
			});
		};

		const onInvalidated = async () => {
			if (!emitLifecycleEvents) {
				return;
			}

			await emitItem({
				source: 'discord.client.invalidated',
				receivedAt: new Date().toISOString(),
			});
		};

		const onWarn = async (message) => {
			if (!emitLifecycleEvents) {
				return;
			}

			await emitItem({
				source: 'discord.client.warn',
				receivedAt: new Date().toISOString(),
				message: String(message),
			});
		};

		const onError = async (error) => {
			if (!emitLifecycleEvents) {
				return;
			}

			await emitItem({
				source: 'discord.client.error',
				receivedAt: new Date().toISOString(),
				message: error && error.message ? error.message : String(error),
			});
		};

		client.on('raw', (packet) => {
			void onRaw(packet);
		});
		client.once('ready', () => {
			void onReady();
		});
		client.on('invalidated', () => {
			void onInvalidated();
		});
		client.on('warn', (message) => {
			void onWarn(message);
		});
		client.on('error', (error) => {
			void onError(error);
		});

		await client.login(botToken);

		return {
			closeFunction: async () => {
				client.removeAllListeners();
				await client.destroy();
			},
		};
	}
}

module.exports = { DiscordRawTrigger };
