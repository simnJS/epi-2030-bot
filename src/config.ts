import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as yaml from 'yaml';

interface Config {
	admins: string[];
}

const configPath = resolve(__dirname, 'config.yaml');
const configFile = readFileSync(configPath, 'utf8');
const config: Config = yaml.parse(configFile);

export default config;