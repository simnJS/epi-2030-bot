import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Events } from '@sapphire/framework';
import { ActivityType } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady })
export class DynamicStatusListener extends Listener {
	private statusIndex = 0;
	private statusInterval: NodeJS.Timeout | null = null;

	private readonly statuses = [
		{ name: 'you', type: ActivityType.Watching },
		{ name: 'coding hard', type: ActivityType.Playing }
	];

	public override run() {
		this.container.logger.info('Starting dynamic status rotation...');
		this.startStatusRotation();
	}

	private startStatusRotation() {
		this.updateStatus();

		this.statusInterval = setInterval(() => {
			this.updateStatus();
		}, 30000);
	}

	private updateStatus() {
		const status = this.statuses[this.statusIndex];

		this.container.client.user?.setPresence({
			activities: [
				{
					name: status.name,
					type: status.type
				}
			],
			status: 'online'
		});


		this.statusIndex = (this.statusIndex + 1) % this.statuses.length;
	}

	public override onUnload() {
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
			this.statusInterval = null;
		}
	}
}
