'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const basename = path.basename(__filename);
const db = {};

// Connection URI
const uri = process.env.DB_URL;

mongoose.connect(uri);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.modelName] = model;
  });


module.exports = db
