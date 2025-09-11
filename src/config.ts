import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'yaml';

interface Config {
	admins: string[];
}

const possiblePaths = [resolve(__dirname, 'config.yaml'), resolve(process.cwd(), 'config.yaml'), resolve(process.cwd(), 'src', 'config.yaml')];

let configPath: string | null = null;
for (const path of possiblePaths) {
	if (existsSync(path)) {
		configPath = path;
		break;
	}
}

if (!configPath) {
	throw new Error('config.yaml not found in any expected location');
}
const configFile = readFileSync(configPath, 'utf8');
const config: Config = yaml.parse(configFile);

export default config;
