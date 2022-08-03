const SSE = require('sse');

module.exports = (server) => {
  const sse = new SSE(server);
  //클라이언트가 웹 푸시에 연결하면 
  sse.on('connection', (client) => { // 서버센트이벤트 연결
    //주기적인 작업
    setInterval(() => {
        //        이렇게 하면 현재 시간을 문자열로 보내준다 1초마다
      client.send(Date.now().toString());
    }, 1000);
  });
};
