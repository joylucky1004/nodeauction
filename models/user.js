const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        //여기에서는 테이블의 컬럼과 연관된 속성
      email: {
        //테이블 옵션 설정
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      money: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,//삭제시간이 만들어짐
      modelName: 'User',//프로그램 안에서 쓸 이름
      tableName: 'users',//실제 테이블 이름
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    //다른 테이블과의 관계
    db.User.hasMany(db.Auction);
  }
};
