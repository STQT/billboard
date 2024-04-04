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

module.exports.CONFIG = CONFIG;
