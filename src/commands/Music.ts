import { ApplyOptions } from '@sapphire/decorators';
import { Awaitable, Command } from '@sapphire/framework';
import fetch, { Response } from 'node-fetch';

@ApplyOptions<Command.Options>({
	name: 'music',
	description: "Get a playable song by providing a link or a title"
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry): Awaitable<void> {
		registry.registerChatInputCommand(
			(builder) => 
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) => option.setName('link-title').setDescription('The link or the title of the music').setRequired(true)),
			{guildIds: ['1391769906944409662']}
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const musicLinkOrTitle = interaction.options.getString('link-title', true);
		const linkRegex = /\b((https?:\/\/)?(www\.)?[a-zA-Z0-9\-_]+\.[a-zA-Z]{2,}\/\S+)\b/;

		if (linkRegex.test(musicLinkOrTitle)) {
			let titleAuthor = ''
			if (/deezer/i.test(musicLinkOrTitle)) {
				titleAuthor = await deezerParse(musicLinkOrTitle);
			}
			else if (/spotify/i.test(musicLinkOrTitle)) {
				titleAuthor = await spotifyParse(musicLinkOrTitle);
			}
			const trackLink = await spotifyLinkGenerator(titleAuthor);
			interaction.reply(trackLink || 'Impossible de récupérer l’ID');
		} else {
			interaction.reply(musicLinkOrTitle);
		}
	}
}

async function deezerParse(shortLink: string): Promise<string> {
	// https://developers.deezer.com/api
	const linkRes: Response = await fetch(shortLink, { redirect: 'follow' });
	const linkData = linkRes.url.split('/').pop() || '';
	const id = linkData.split('?')[0];

	const response = await fetch('https://api.deezer.com/track/'+ id)
	const data = await response.json()
	// duration is recuperable
	const titleAuthor = `${data.title} ${data.artist.name}`
	return titleAuthor
;
}

async function spotifyParse(link: string): Promise<string> {
  return link;
}

async function spotifyLinkGenerator(titleAuthor: string): Promise<string>{
	return titleAuthor;
}