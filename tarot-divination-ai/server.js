const http = require('http');
const fs = require('fs/promises');
const path = require('path');

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const API_BASE_URL = (process.env.ANYTOKENS_BASE_URL || 'https://anytokens.cc').replace(/\/$/, '');
const API_KEY = process.env.ANYTOKENS_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '';

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');

    try {
        const envContent = require('fs').readFileSync(envPath, 'utf8');

        envContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .forEach(line => {
                const separatorIndex = line.indexOf('=');

                if (separatorIndex === -1) {
                    return;
                }

                const key = line.slice(0, separatorIndex).trim();
                const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

                if (key && !process.env[key]) {
                    process.env[key] = value;
                }
            });
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn('Failed to load .env file:', error.message);
        }
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function parseJsonSafely(rawText) {
    try {
        return JSON.parse(rawText);
    } catch {
        return rawText;
    }
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('请求体不是有效的 JSON'));
            }
        });

        req.on('error', reject);
    });
}

async function handleTarotRequest(req, res) {
    if (!API_KEY) {
        sendJson(res, 500, {
            error: '缺少 API Key',
            hint: '启动前请设置 ANYTOKENS_API_KEY 或 ANTHROPIC_AUTH_TOKEN 环境变量。'
        });
        return;
    }

    let payload;

    try {
        payload = await readRequestBody(req);
    } catch (error) {
        sendJson(res, 400, { error: error.message });
        return;
    }

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
        sendJson(res, 400, { error: 'messages 不能为空' });
        return;
    }

    try {
        const upstreamResponse = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: payload.model || 'gpt-5.4',
                messages: payload.messages,
                temperature: payload.temperature ?? 0.8,
                max_tokens: payload.max_tokens ?? 800
            })
        });

        const rawResponse = await upstreamResponse.text();
        const parsedResponse = parseJsonSafely(rawResponse);

        if (!upstreamResponse.ok) {
            sendJson(res, upstreamResponse.status, {
                error: '上游接口返回错误',
                details: parsedResponse
            });
            return;
        }

        sendJson(res, 200, parsedResponse);
    } catch (error) {
        sendJson(res, 502, {
            error: '代理请求失败',
            details: error.message
        });
    }
}

async function serveStaticFile(res, pathname) {
    const normalizedPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(ROOT_DIR, `.${normalizedPath}`);

    if (!filePath.startsWith(ROOT_DIR)) {
        sendJson(res, 403, { error: '禁止访问该路径' });
        return;
    }

    try {
        const fileContent = await fs.readFile(filePath);
        const extname = path.extname(filePath);
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
    } catch (error) {
        if (error.code === 'ENOENT') {
            sendJson(res, 404, { error: '文件不存在' });
            return;
        }

        sendJson(res, 500, { error: '静态文件读取失败' });
    }
}

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && requestUrl.pathname === '/api/tarot') {
        await handleTarotRequest(req, res);
        return;
    }

    if (req.method === 'GET') {
        await serveStaticFile(res, requestUrl.pathname);
        return;
    }

    sendJson(res, 405, { error: '不支持的请求方法' });
});

server.listen(PORT, () => {
    console.log(`Tarot app running at http://localhost:${PORT}`);
});