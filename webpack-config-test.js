const envDefs = require('dotenv').config({
    silent: false,
    path: './.test.env',
}) || {};
module.exports = require('./webpack-config-server.js');
