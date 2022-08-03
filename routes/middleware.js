//일반적으로 미들웨어 개념은 클라이언트의 요청을 처리하기 전에 수행하는 프로글램
//미들웨어가 주로 하는 일은 요청을 처리하기 전에 반드시 수행해야 하는 내용(쿠키, 세션, 파라미터 인코딩 등)
//이나 유효성 검사(요청을 처리하기 전에 확인할 내용들로 로그인 여부가 대표적이며 
//또는 파라미터 값의 유효성 검사하기도 한다)

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/?loginError=로그인이 필요합니다.');
    }
  };

exports.isNotLoggedIn = (req, res, next) => {
  //console.log(isAuthenticated());
    if (!req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/');
    }
  };
  
  