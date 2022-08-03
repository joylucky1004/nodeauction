
// const fs = require('fs'); 
// const path = require('path');
const Sequelize = require('sequelize');

const User = require('./user');
const Good = require('./good');
const Auction = require('./auction');


// const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

//var sequelize = new Sequelize(process.env[config.use_env_variable], config);
//위의 식에서 아래 식으로 바꿈
const sequelize = new Sequelize(config.database, config.username, config.password, config );

db.sequelize = sequelize;
db.User = User;
db.Good = Good;
db.Auction = Auction;

User.init(sequelize);
Good.init(sequelize);
Auction.init(sequelize);

User.associate(db);
Good.associate(db);
Auction.associate(db);

module.exports = db;

