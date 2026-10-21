import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const standalone = resolve('.next/standalone');
mkdirSync(resolve(standalone, '.next'), { recursive: true });
cpSync('public', resolve(standalone, 'public'), { recursive: true });
cpSync('.next/static', resolve(standalone, '.next/static'), { recursive: true });
const hostnameOption = process.argv.indexOf('--hostname');
process.env.HOSTNAME = hostnameOption >= 0 ? process.argv[hostnameOption + 1] : (process.env.BIDCRAFT_HOST || '0.0.0.0');
await import(pathToFileURL(resolve(standalone, 'server.js')).href);
