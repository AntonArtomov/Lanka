// Живий виклик Gemini з поточними налаштуваннями: перевіряє ключ, назву
// моделі й thinkingLevel. Запуск: GEMINI_API_KEY=… npm run check
import { configFromEnv } from '../src/server.ts';
import { streamGemini } from '../src/gemini.ts';

const { gemini } = configFromEnv();
if (!gemini.apiKey) { console.error('Задай GEMINI_API_KEY'); process.exit(1); }
console.log(`модель ${gemini.model}, thinking ${gemini.thinking || '(вимкнено)'}`);
try {
  let text = '';
  const started = Date.now();
  for await (const part of streamGemini(gemini, 'Відповідай українською, одним реченням.',
    [{ role: 'user', text: 'Привіт! Хто такий Георгій Нарбут?' }], AbortSignal.timeout(30_000))) text += part;
  console.log(`OK за ${Date.now() - started} мс: ${text}`);
} catch (error) {
  console.error('Помилка:', (error as Error).message);
  process.exit(1);
}
