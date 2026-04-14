const nacl = require('tweetnacl');

class DiscordSignatureValidator {
	description = {
		displayName: 'Discord Signature Validator',
		name: 'discordSignatureValidator',
		icon: 'file:icon.png',
		group: ['transform'],
		version: 1,
		description: 'Validates Discord ED25519 request signatures',
		defaults: {
			name: 'Discord Signature Validator',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Public Key (hex)',
				name: 'publicKey',
				type: 'string',
				default: '',
				required: true,
				description: 'Discord application public key in hex (no 0x)',
			},
			{
				displayName: 'Signature (hex)',
				name: 'signature',
				type: 'string',
				default: '',
				required: true,
				description: 'Header x-signature-ed25519 (hex)',
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'string',
				default: '',
				required: true,
				description: 'Header x-signature-timestamp',
			},
			{
				displayName: 'Raw Body',
				name: 'rawBody',
				type: 'string',
				default: '',
				required: true,
				description: 'Raw request body as string (unparsed).',
			},
		],
	};

	async execute() {
		const items = this.getInputData();
		const returnData = [];

		for (let i = 0; i < items.length; i++) {
			const publicKey = this.getNodeParameter('publicKey', i);
			const signature = this.getNodeParameter('signature', i);
			const timestamp = this.getNodeParameter('timestamp', i);
			const rawBody = this.getNodeParameter('rawBody', i);

			try {
				const sigUint8 = Buffer.from(signature, 'hex');
				const pubUint8 = Buffer.from(publicKey, 'hex');
				const messageUint8 = Buffer.from(timestamp + rawBody, 'utf8');

				const isValid = nacl.sign.detached.verify(messageUint8, sigUint8, pubUint8);

				returnData.push({
					json: {
						valid: !!isValid,
						signature,
						timestamp,
						messageSample:
							rawBody.length > 60 ? rawBody.slice(0, 60) + '...' : rawBody,
					},
				});
			} catch (err) {
				returnData.push({
					json: {
						valid: false,
						error: err.message || String(err),
					},
				});
			}
		}

		return this.prepareOutputData(returnData);
	}
}

module.exports = { DiscordSignatureValidator };
