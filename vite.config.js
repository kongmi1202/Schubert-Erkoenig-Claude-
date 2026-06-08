import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}

function loadLocalEnv() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.local'));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function createHandlerResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(data) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(data));
    }
  };
}

function netlifyApiDevPlugin() {
  loadLocalEnv();

  return {
    name: 'netlify-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const match = pathname.match(/^\/api\/([^/]+)$/);
        if (!match || req.method !== 'POST') {
          next();
          return;
        }

        const handlerFile = path.join(rootDir, 'api', `${match[1]}.js`);
        if (!fs.existsSync(handlerFile)) {
          next();
          return;
        }

        try {
          const body = await readJsonBody(req);
          const mod = await import(`${pathToFileURL(handlerFile).href}?t=${Date.now()}`);
          await mod.default(
            { method: req.method, body },
            createHandlerResponse(res)
          );
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            error: err?.message || 'API 처리 중 오류가 발생했습니다.'
          }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [netlifyApiDevPlugin()]
});
