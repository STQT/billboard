const { app } = require('electron');
const Sentry = require('@sentry/electron');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

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
    replaysOnErrorSampleRate: 1.0,
    integrations: [
        // Specify your integrations here if needed.
    ],
});

module.exports.Sentry = Sentry;
module.exports.CONFIG = CONFIG;
