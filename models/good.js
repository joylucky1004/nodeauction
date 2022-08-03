const Sequelize = require('sequelize');

module.exports = class Good extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, 
    {
        sequelize,
        timestamps: true,
        paranoid: true,
        modelName: 'Good',
        tableName: 'goods',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      });
    }
  
    static associate(db) {
        //1:N 관계가 되면 belongsTo로 된다 
      db.Good.belongsTo(db.User, { as: 'Owner' });
      //                          여기는 상품을 등록한 사람
      db.Good.belongsTo(db.User, { as: 'Sold' });
      //                          여기는 상품을 판매한 사람
      db.Good.hasMany(db.Auction);
    }
  };
  