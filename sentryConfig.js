const Sentry = require('@sentry/electron/main');
const {CONFIG} = require("./settings");


Sentry.init({
  dsn: CONFIG.sentry_dsn,
});
module.exports = Sentry;