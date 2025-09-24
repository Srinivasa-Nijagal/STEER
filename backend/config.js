import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

try {
    const data = fs.readFileSync(envPath, 'utf8');
    data.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').trim();
            if (key) {
                process.env[key.trim()] = value;
            }
        }
    });
    console.log('Environment variables loaded successfully.');
} catch (err) {
    console.error('CRITICAL ERROR: Could not load .env file.', err);
    process.exit(1); // Exit if config fails to load
}
