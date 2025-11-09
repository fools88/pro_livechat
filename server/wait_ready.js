const http = require('http');
const fs = require('fs');
const max = 30;
(async ()=>{
  for (let i=0;i<max;i++){
    try{
          await new Promise((res, rej)=>{
            const req = http.request({hostname:'127.0.0.1', port:8081, path:'/ready', method:'GET', timeout:3000}, (r)=>{
              let body=''; r.on('data',c=>body+=c); r.on('end',()=>{ res({ statusCode: r.statusCode, body }) });
            });
            req.on('error', rej); req.end();
          }).then(({statusCode, body})=>{
            if (statusCode===200){
              fs.writeFileSync('..\\tmp\\ready_response.txt', body, 'utf8');
              logger.info('READY_OK'); process.exit(0);
            }
          }).catch(()=>{});
        }catch(e){}
    await new Promise(r=>setTimeout(r,2000));
  }
  logger.error('READY_TIMEOUT'); process.exit(1);
})();
