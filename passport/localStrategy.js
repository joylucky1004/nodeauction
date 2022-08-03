const passport = require('passport');
//모듈부터 가져온다
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',//테이블에 있는 이름을 써줘야 하고
    passwordField: 'password',
    
  }, async (email, password, done) => {
    try {
        //email에 해당되는 데이터 찾기
        const exUser = await User.findOne({where:{email}});
        if (exUser) {
            //비밀번호를 비교
          const result = await bcrypt.compare(password, exUser.password);
          if (result) {
            //로그인성공인 경우 회원정보를 전달
            done(null, exUser);
          } else {
            //로그인실패
            done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
          }
        } else {
          done(null, false, { message: '가입되지 않은 회원입니다.' });
        }
        
      } catch (error) {
        console.error(error);
        done(error);
      }
    }));
  };
  