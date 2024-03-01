const fs = require ('fs');

let demo = require ('../dist/index');

//PNG
let images = ['./img/1.png', './img/2.png', './img/3.png', './img/4.png', './img/5.png', './img/6.png'];
let pngImgBuffer = [];
for (let i = 0;i < images.length;i ++){
  pngImgBuffer.push (Buffer.from (fs.readFileSync (images[i])));
}

//GIF
let gifImgBuffer = Buffer.from (fs.readFileSync ('./img/loading.gif'));

let run = async() => {
  
  //pngToApng RGBA
  await demo.pngToApngRGBA (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output1.png', data);
  });

  //pngToApng PLTE
  await demo.pngToApngPLTE (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output2.png', data);

  });
  //gifToApng RGBA
  await demo.gifToApngRGBA (gifImgBuffer).then (data => {
    fs.writeFileSync ('./output/output3.png', data);
  
  });

  //gifToApng PLTE 
  await demo.gifToApngPLTE (gifImgBuffer).then (data => {
    fs.writeFileSync ('./output/output4.png', data);
  
  });

  /*  客製化
 {
    allDelayNum:null, //如果有值 統一秒數 x/100 秒
    allBlendOp:null, //如果有值 統一混色
    bitDepth: 8, // 顏色深度
    colorType: 6, // 顏色類型
    compressionMethod: 0, // 壓縮方法
    filterMethod: 0, // 濾波器
    interlaceMethod: 0, // 隔行掃描方式
    numPlays: 0, // 設定循環次數 0為無限次
    fc: [{
      xOffset: 0, // X 偏移
      yOffset: 0, // Y 偏移
      delayNum: 20, // 延遲時間分子 單獨設定可蓋過 統一秒數
      delayDen: 100, // 延遲時間分母 單獨設定可蓋過 統一秒數
      disposeOp: 0, // Dispose 操作 0不進行處理 1完全清除 2 渲染回上一個
      blendOp: 0, // Blend 操作 0覆蓋所有顏色  1混和顏色  單獨設定可蓋過 統一混色
    }]
  }
  */
  //gifToApng RGBA
  await demo.gifToApngRGBA (gifImgBuffer, 
    { 'numPlays': 5,
      'fc': [
        { 'delayNum': 10, 'delayDen': 100 },
        { 'delayNum': 20, 'delayDen': 100 }
      ] })
    .then (data => {
      fs.writeFileSync ('./output/output5.png', data);
    });

};
run ();