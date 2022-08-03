//1번 3가지들은 기본적인 특형태다 
//로그인을 위한 처리하기위한 코드 기본코드 1번 3개


const express = require('express');//1번
const passport = require('passport');
const bcrypt = require('bcrypt');

const { isLoggedIn, isNotLoggedIn } = require('./middleware');
const User = require('../models/user');

const router = express.Router();//1번

//회원가입을 처리한다
//이것은 로그인 안됫을때만 해야한다
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    //파라미터 읽어오기 
    const { email, nick, password, money } = req.body;
    try {
        //email 중복확인을 위해서 데이터를 가져오기
      const exUser = await User.findOne({where:{email}});
      //email이 존재하면 메시지와 함께 회원가입 페이지로 이동
      if (exUser) {
        return res.redirect('/join?joinError=이미 가입된 이메일입니다.');
      }
      //비밀번호 함호화
      const hash = await bcrypt.hash(password, 12);
      //데이터 저장
      await User.create({
        email,
        nick,
        password: hash,
        money,
      });
      //메인페이지로 리다이렉트
      return res.redirect('/');

    } catch (error) {
      console.error(error);
      return next(error);
    }
  });

//로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        //로그인 요청 시 에러가 발생화면 중단
      if (authError) {
        console.error(authError);
        return next(authError);
    }
    if (!user) {
        //로그인 실패했을때
        //메인 요청으로 이동하는데 로그인 실패
        //메시지를 가지고 이동한다
        return res.redirect(`/?loginError=${info.message}`);
      }
      //유저정보가 넘어왔을때
      return req.login(user, (loginError) => {
        //이러나면
        if (loginError) {
          console.error(loginError);
          return next(loginError);
        }
        //정상적으로 로그인 되었을때 순간은 여기이다
        return res.redirect('/');
      });
    })(req, res, next);
  });

//참고로 로그아웃을 처리할 때 클라이언트에서 로그아웃을 누를 때 처리를 하고 이런경우 브라우저를
//강제 종료하면 로그아웃이 발생하지 않는다 
//참고해서 만들어야 한다
//브라우저의 beforeunload 라는 이벤트에서 로그아웃 요청을 해주면 브라우저를 강제로 종료 할 때 
//로그아웃 처리를 할 수 있다

//로그아웃은 일반적으로 get으로 처리를 많이 한다
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout(function(err){
    if(err){
      return next(err);
    }
    //로그아웃을 할때는 로그아웃 함수만 불러주면 된다
    //세련도 항상 소멸을 해줘야한다
    req.session.destroy();
    res.redirect('/');
  });

  });
  
  module.exports = router;//1번
  