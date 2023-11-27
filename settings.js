const path = require('path')
const Sentry = require('electron').remote.require('@sentry/electron');
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

const CONFIG = {
    PRODUCTION_MODE: true,
    BASE_URL: process.env.BILLBOARD_API_URL,
    auth: {
        username: process.env.BILLBOARD_API_USERNAME,
        password: process.env.BILLBOARD_API_PASSWORD
    },
    WIDTH: process.env.WIDTH,
    HEIGHT: process.env.HEIGHT,
    sentry_dsn: process.env.SENTRY,
    OWM_API_KEY: process.env.OWM
};


Sentry.init({
    dsn: CONFIG.sentry_dsn,
    replaysSessionSampleRate: 0.1,
      // If the entire session is not sampled, use the below sample rate to sample
      // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    integrations: [new Sentry.Replay()],
});
module.exports.Sentry = Sentry;
module.exports.CONFIG = CONFIG;
