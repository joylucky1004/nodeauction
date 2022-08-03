//웹 서버 모듈 추출
const express = require('express');

//.env 파일의 내용을 메모리에 로드
const dotenv = require('dotenv');
dotenv.config();

//서버 설정
const app = express();
app.set('port', process.env.PORT);

//로그 출력을 위한 파일 과 경로를 위한 모듈 설정
const path = require('path');

// static 파일의 경로 설정
// static 파일 - 내용이 변하지 않는 파일
// html,css, js, 미이지, 동영상, 사운드 파일 등
// 이 파일의 경로는 / 가 프로젝트 내의 public 과 매핑됨
app.use(express.static(path.join(__dirname, 'public')));

//템플릿 엔진(서버의 데이터를 뷰 파일에 출력할 수 있도록 해주는 모듈) 설정 - nunjucks
const nunjucks = require('nunjucks');
//데이터를 출력하는 뷰 파일의 확장자는 html 이고
//뷰 파일의 위치는 views 디렉토리로 설정
app.set('view engine', 'html'); 
nunjucks.configure('views', {
    express:app,
    watch: true, 
});

//파일에 읽고 쓰기를 위한 모듈 추출
const fs = require('fs');
//로그를 기록하기 위한 모듈
const morgan = require('morgan');
//로그를 파일에 출력하기 위한 모듈
const FileStreamRotator = require('file-stream-rotator');



// 로그 디렉토리 생성             이것만 쓰면 현재디렉토리까지만 되고 뒤에 log 하면 로그디렉토리까지 만들어짐
const logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// 로그 파일 옵션 설정
const accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  //실제 파일 이름은 logDirectory 에다가 access이것을 더한것이다
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  //frequency가 얼마나 자주
  frequency: 'daily',
  verbose: false
});

// 로그 설정             이렇게 만들면 일자별로 만들어진다
app.use(morgan('combined', {stream: accessLogStream}));

//출력하는 파일 압축해서 전송
const compression = require('compression');
app.use(compression());

//post 방식의 파라미터 읽기
var bodyParser = require('body-parser');
app.use( bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
})); 

//쿠키(서버와 클라이어느 사이에 연결을 유지하도록 하기 위해서 클라이언트에 데이터를 저장하고 요청을
//보낼때 마다 쿠키를 전송) 설정
const cookieParser = require('cookie-parser');
app.use(cookieParser(process. env.COOKIE_SECRET));

//세션 설정
//세션 - 서버에 저장
//세션은 기본적으로 서버의 메모리에 저장되는데
//세션의 개수가 많아지면 서버의 메모리에 부담이 생기고
//서버가 재부팅 되었을 때 클라이언트의 모든 세션이 소멸된다
//최근에는 세션을 파일이나 데이터베이스에 저장하는 경우가 있다
const session = require("express-session");
var options = {
    host :process.env.HOST,
	port : process.env.MYSQLPORT,
	user : process.env.USERID,
	password : process.env.PASSWORD,
	database : process.env.DATABASE
};

const MySQLStore = require('express-mysql-session')(session);

app.use(
    session({
      secret: process.env.COOKIE_SECRET,
      resave: false,
      saveUninitialized: true,//저장할때 초기화 할것이냐?
      store : new MySQLStore(options)
    })
);

//데이터베이스 사용설정
const {sequelize} = require('./models');
sequelize.sync({force:false})//false가 되면 맨 처음 한번만 만든다
//true가 되면 지웠다만들다 지웠다 만들다 반복한다
.then(() => {
    console.log('데이터베이스 연결 성공');
})
.catch((err) => {
    console.err(err);
})
  

//passport 설정
const passport = require('passport');
const passportConfig = require('./passport');
passportConfig();
app.use(passport.initialize());
app.use(passport.session());


const checkAuction = require('./checkAuction');
checkAuction();



//라우팅 처리
//클라이언트의 요청이 온 경우 처리 구문
const indexRouter = require('./routes');
app.use('/', indexRouter);

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);






//에러가 발생한 경우 처리 << 이것은 라우팅하다가 에러가 발생
app.use((req, res, next) => {
    const err = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	err.status = 404;
	next(err);
});

//에러가 발생한 경우 처리 << 이것은 라우팅이 아닌 처리를 하다가 에러가 발생하는경우
app.use((err, req, res, next) => {
	res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});



const sse = require('./sse');
const webSocket = require('./socket');

//서버 실행
const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});

webSocket(server, app);
sse(server);
  