const WS = require('./src/webhook-server');

const x = new WS(23444, 'https://mgw18f.localtunnel.me', '15c38c005ad9630aabd4d5307c22ca75', '18e6dab251f49363a0a3fd828bf142436ba489bc2db42c4a285a4a5f321af4da', 'e5937dbddab7b3d4d782c1fa4551a353385b5973dad377ecdc608512470d7a1b');
x.start('56ce2e0d27b1887cd032ef63').then(webhookID => {
  console.log(`webhook ID ${webhookID} ready`);
  x.on('data', d => {
    console.log('get webhook event');
  });
}).catch(e => {
  console.log('error');
  console.log(e);
});

function cleanup() {
  x.cleanup().then(() => process.exit(0));
}

//process.on('SIGINT', cleanup);
//process.on('SIGTERM', cleanup);
//process.on('exit', () => { });
