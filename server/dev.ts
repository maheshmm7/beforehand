import { createApp } from './app';
import { readConfig } from './config';

const config = readConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`api listening on http://localhost:${String(config.port)}`);
});
