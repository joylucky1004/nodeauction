const express = require('express');

//파일 업로드 설정
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Good, Auction, User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middleware');

const router = express.Router();

//url이 없으면 무조건 하는것이다 
//모든 요청
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

try {
    fs.readdirSync('public/uploads');
  } catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('public/uploads');
  }



router.get('/', async (req, res, next) => {
  try {
    //goods 테이블에서 SoldId가 null 인 데이터만 조회
    const goods = await Good.findAll({ where: { SoldId: null } });
    res.render('main', {
      title: 'NodeAuction',
      //goods 가 main.html 에서 14줄 goods랑 같아야 한다 
      goods
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {title: '회원가입'});
});

//상품 등록을 위한 요청 처리 코드
router.get('/good', isLoggedIn, (req, res) => {
    res.render('good', {title:'상품등록'})
});

//파일이 저장될 디렉토리를 생성
try{
    fs.readdirSync('public/uploads');
}catch(err){
    fs.mkdirSync('public/uploads');
}

//파일 업로드 객체 생성
const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, 'public/uploads/');
      },
      filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
      },
    }), limits: { fileSize: 5 * 1024 * 1024 },
  });
  

const schedule = require('node-schedule');

//상품 등록
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
    try {
        //파라미터 읽어오기
      const { name, price } = req.body;

      await Good.create({
        OwnerId: req.user.id,
        name,
        img: req.file.filename,
        price
      });

//하루 뒤에 가장 큰 금액을 제시한 유저에게 낙찰하고 잔액에서 낙찰 금액을 빼기
    const end = new Date();
    end.setDate(end.getDate() + 1); // 하루 뒤

    schedule.scheduleJob(end, async () => {
      const success = await Auction.findOne({

        where: { GoodId: good.id },
        order: [['bid', 'DESC']],
      });
      await Good.update({ SoldId: success.UserId }, { where: { id: good.id } });
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),
      }, {
        where: { id: success.UserId },
      });
    });

      res.redirect('/');
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

  //입장 버튼을 눌렀을 때 처리
  router.get('/good/:id', isLoggedIn, async (req, res, next) => {
    try {
      //하나의 상품 정보와 입찰 정보를 가져오기 
      const [good, auction] = await Promise.all([
        Good.findOne({
          where:{id: req.params.id},
          include:{
            model:User,
            as:'Owner',
          },
        }),
        Auction.findAll({
          where:{GoodId: req.params.id},
          include:{model: User},
          order:[['bid', 'ASC']],
        }),
      ]);
      
      res.render('auction', {
        title: `${good.name}`,
        good,
        auction,
      });

    } catch (error) {
      console.error(error);
      next(error);
    }
  });
  
//입찰을 눌렀을때 
router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
    try {
      //파라미터를 읽어오기
      const { bid, msg } = req.body;
      //데이터를 가져오기
      const good = await Good.findOne({
        where: { id: req.params.id },
        include: { model: Auction },
        order: [[{ model: Auction }, 'bid', 'DESC']],
      });
      if (good.price >= bid) {
        return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
      }
      if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()) {
        return res.status(403).send('경매가 이미 종료되었습니다');
      }
      if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
        return res.status(403).send('이전 입찰가보다 높아야 합니다');
      }

      //입찰 추가
      const result = await Auction.create({
        bid,
        msg,
        UserId: req.user.id,
        GoodId: req.params.id,
      });

      // 실시간으로 등록된 정보를 웹 소켓을 이용해서 전달
      req.app.get('io').to(req.params.id).emit('bid', {
        bid: result.bid,
        msg: result.msg,
        nick: req.user.nick,
      });
      return res.send('ok');

    } catch (error) {
      console.error(error);
      return next(error);
    }
  });


  router.get('/list', isLoggedIn, async (req, res, next) => {
    try {
      //로그인 한 유저가 입찰 목록을 전부 찾아오기
      const goods = await Good.findAll({
        where: { SoldId: req.user.id },
        include: { model: Auction },
        order: [[{ model: Auction }, 'bid', 'DESC']],
      });
      res.render('list', { title: '입찰 목록', goods });
    } catch (error) {
      console.error(error);
      next(error);
    }
  });
  
  

  module.exports = router;
  