import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ActivityType, type Client } from 'discord.js';

@ApplyOptions<Listener.Options>({ once: true })
export class DynamicStatusListener extends Listener {
	private statusIndex = 0;
	private statusInterval: NodeJS.Timeout | null = null;
	
	private readonly statuses = [
		{ name: 'watching you', type: ActivityType.Watching },
		{ name: 'coding hard', type: ActivityType.Playing }
	];

	public override run() {
		this.startStatusRotation();
	}

	private startStatusRotation() {
		// Set initial status
		this.updateStatus();
		
		// Rotate status every 30 seconds
		this.statusInterval = setInterval(() => {
			this.updateStatus();
		}, 30000);
	}

	private updateStatus() {
		const client = this.container.client as Client;
		const status = this.statuses[this.statusIndex];
		
		client.user?.setPresence({
			activities: [{
				name: status.name,
				type: status.type
			}],
			status: 'online'
		});

		// Move to next status
		this.statusIndex = (this.statusIndex + 1) % this.statuses.length;
	}

	public override onUnload() {
		if (this.statusInterval) {
			clearInterval(this.statusInterval);
		}
	}
}