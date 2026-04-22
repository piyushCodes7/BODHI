const fs = require('fs');
const os = require('os');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Return common LAN patterns (192.x, 10.x, 172.x)
                if (iface.address.startsWith('192.168.') || 
                    iface.address.startsWith('10.') || 
                    iface.address.startsWith('172.')) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}

function updateEnv() {
    const ip = getLocalIp();
    const newBaseUrl = `http://${ip}:8000`;
    console.log(`📡 Detected LAN IP: ${ip}`);

    if (!fs.existsSync(ENV_PATH)) {
        console.log('⚠️ .env file not found, creating one...');
        fs.writeFileSync(ENV_PATH, `API_BASE_URL=${newBaseUrl}\n`);
        return;
    }

    let content = fs.readFileSync(ENV_PATH, 'utf8');
    const regex = /^API_BASE_URL=.*$/m;

    if (regex.test(content)) {
        content = content.replace(regex, `API_BASE_URL=${newBaseUrl}`);
    } else {
        content += `\nAPI_BASE_URL=${newBaseUrl}`;
    }

    fs.writeFileSync(ENV_PATH, content);
    console.log(`✅ Updated .env: API_BASE_URL=${newBaseUrl}`);
}

updateEnv();
