import { createApp } from './app.ts';
import { readConfig } from './config.ts';

const config = readConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`api listening on http://localhost:${String(config.port)}`);
});
