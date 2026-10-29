import { createApp } from '../server/app';
import { readConfig } from '../server/config';

// One serverless function serves every /api route.
export default createApp(readConfig());
