import './lib/setup';
import Groq from 'groq-sdk';
import { container, LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { IdeaTaskService } from './services/IdeaTaskService';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	presence: {
		activities: [
			{
				name: 'you',
				type: 3
			}
		],
		status: 'online'
	}
});

const main = async () => {
	try {
		try {
			await prisma.$connect();
			client.logger.info('Database connection established');
		} catch (error) {
			client.logger.fatal('Failed to connect to database:', error);
			process.exit(1);
		}

		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');

		try {
			await ideaTaskService.start();
		} catch (error) {
			client.logger.error('Failed to start IdeaTaskService:', error);
		}

		const shutdown = async (signal: string) => {
			client.logger.info(`${signal} received, shutting down gracefully...`);

			ideaTaskService.stop();
			await prisma.$disconnect();
			await client.destroy();

			process.exit(0);
		};

		process.on('SIGINT', () => shutdown('SIGINT'));
		process.on('SIGTERM', () => shutdown('SIGTERM'));
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEY!
});

const prisma = new PrismaClient();
const ideaTaskService = new IdeaTaskService();

declare module '@sapphire/pieces' {
	interface Container {
		groq: Groq;
		prisma: PrismaClient;
		ideaTaskService: IdeaTaskService;
	}
}

container.groq = groq;
container.prisma = prisma;
container.ideaTaskService = ideaTaskService;

void main();
