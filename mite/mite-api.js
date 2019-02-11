const miteApi = require("mite-api")

const createMiteApi = apiKey => miteApi({
    account: 'leanovate',
    apiKey: apiKey,
    applicationName: 'leanovate-mite-reminder'
});

module.exports = {
    createMiteApi
}