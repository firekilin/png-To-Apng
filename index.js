const fs = require ('fs');
const { cunk, pngToApngRGB } = require ('./utils');

let run = async() => {
  let images = ['1.png', '2.png'];

  let imagesBuffer = [];
  for (let i = 0;i < images.length;i ++){
    imagesBuffer.push (Buffer.from (fs.readFileSync (images[i])));
  }
    
  /*
     pngSignature
    IHDR
    acTL 圖案標頭 控制動畫
    PLTE
    tRNS
    fcTL 第一張圖標頭
    IDAT(fdAT) 第一張圖
    fcTL 第二張圖標頭
    fdAT 第二張圖
    fcTL 第三張圖標頭
    fdAT 第三張圖
    */
    
    
    
  //step 1
  const pngSignature = Buffer.from ([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    
  //step 2 create IHDR
  const width = 130; // 寬度
  const height = 120; // 高度
  const bitDepth = 8; // 深度，通常8
  const colorType = 6; // 類型，通常 6（真彩色） 若為apng 為3
  const compressionMethod = 0; // 压缩方法，通常为 0（deflate/inflate 压缩）
  const filterMethod = 0; // 滤波器方法，通常为 0（adaptive filtering）
  const interlaceMethod = 0; // 隔行扫描方法，通常为 0（不使用隔行扫描）
    
  const ihdr = Buffer.alloc (13); // 建立 Buffer
  ihdr.writeUInt32BE (width, 0); // 寬度
  ihdr.writeUInt32BE (height, 4); // 高度
  ihdr.writeUInt8 (bitDepth, 8); // 顏色深度
  ihdr.writeUInt8 (colorType, 9); // 顏色類型
  ihdr.writeUInt8 (compressionMethod, 10); // 壓縮方法
  ihdr.writeUInt8 (filterMethod, 11); // 濾波器
  ihdr.writeUInt8 (interlaceMethod, 12); // 隔行掃描方式
  const ihdrChunk = new cunk ('IHDR', ihdr);
  //step 3 create acTL
  const numFrames = 2; // 設定數量
  const numPlays = 0; // 設定循環次數 0為無限次
  const acTL = Buffer.alloc (8);
  acTL.writeUInt32BE (numFrames, 0);
  acTL.writeUInt32BE (numPlays, 4);
  const acTLCunk = new cunk ('acTL', acTL);
    
  //step 4 create PLTE 由png取得
  // let PLTElen = 0;
  // imagesBuffer.forEach (obj => {PLTElen += obj.length;});
  // let PLTE = Buffer.alloc (PLTElen);
  // let beforeLen = 0;
  // for (let i = 0;i < imagesBuffer.length;i ++){
  //   console.log ( getCunkDetail (imagesBuffer[i], 'PLTE'));
  //   getCunkDetail (imagesBuffer[i], 'PLTE').copy (PLTE, beforeLen);
  //   beforeLen += imagesBuffer[i].length;
  // }
  // const PLTECunk = new cunk ('PLTE', PLTE);
  let PLTE = Buffer.alloc (12);
  Buffer.from ([0, 0, 0]).copy (PLTE, 0);
  Buffer.from ([
    (16707535 >> 16) & 0xFF,
    (16707535 >> 8) & 0xFF,
    16707535 & 0xFF]).copy (PLTE, 3);
  Buffer.from ([
    (16417117 >> 16) & 0xFF,
    (16417117 >> 8) & 0xFF,
    16417117 & 0xFF]).copy (PLTE, 6);
  Buffer.from ([
    (16428381 >> 16) & 0xFF,
    (16428381 >> 8) & 0xFF,
    16428381 & 0xFF]).copy (PLTE, 9);
  const PLTECunk = new cunk ('PLTE', PLTE);
  console.log (PLTECunk.getBuffer ());
    
    
    
  // step 5 create tRNS
  let tRNS = Buffer.alloc (1);
  tRNS.writeInt8 (0, 0);
  const tRNSCunk = new cunk ('tRNS', tRNS);
    
  //step 6 迴圈 第一圈 圖片 IDAT
  let sequenceNumber = 0; // 序號
  const xOffset = 0; // X 偏移
  const yOffset = 0; // Y 偏移
  const delayNum = 20; // 延遲時間分子
  const delayDen = 100; // 延遲時間分母
  const disposeOp = 0; // Dispose 操作    0不進行處理 1完全清除 2 渲染回上一個
  const blendOp = 0; // Blend 操作        0覆蓋所有顏色  1混和顏色
    
  let bodyBuffer = [];
  for (let i = 0;i < imagesBuffer.length;i ++){
    let fcTL = Buffer.alloc (26);
    fcTL.writeUInt32BE (sequenceNumber, 0);
    fcTL.writeUInt32BE (width, 4);
    fcTL.writeUInt32BE (height, 8);
    fcTL.writeUInt32BE (xOffset, 12);
    fcTL.writeUInt32BE (yOffset, 16);
    fcTL.writeUint16BE (delayNum, 20);
    fcTL.writeUint16BE (delayDen, 22);
    fcTL.writeInt8 (disposeOp, 24);
    fcTL.writeInt8 (blendOp, 25);
    let fcTLCunk = new cunk ('fcTL', fcTL);
    sequenceNumber ++;
    bodyBuffer.push (fcTLCunk.getBuffer ());
    if (i == 0){

      let IDAT = new cunk ('IDAT', await pngToApngRGB (imagesBuffer[i]));
      bodyBuffer.push (IDAT.getBuffer ());
    } else {
      let fdAT = Buffer.alloc (imagesBuffer[i].length + 4);
      fdAT.writeUInt32BE (sequenceNumber, 0);
      let imgTemp = await pngToApngRGB (imagesBuffer[i]);
      imgTemp.copy (fdAT, 4);
      let fdATCunk = new cunk ('fdAT', fdAT);
      bodyBuffer.push (fdATCunk.getBuffer ());
      sequenceNumber ++;
    }
  }
    
  let bodyLen = 0;
  bodyBuffer.forEach (obj => {bodyLen += obj.length;});
  beforeLen = 0;
  let body = Buffer.alloc (bodyLen);
  for (let i = 0;i < bodyBuffer.length;i ++){
    bodyBuffer[i].copy (body, beforeLen);
    beforeLen += bodyBuffer[i].length;
  }
    
    
    
    
    
  //step 7 IEND
  let IEND = Buffer.alloc (0);
  let IENDCunk = new cunk ('IEND', IEND);
    
    
    
  const apngData = Buffer.concat ([pngSignature, ihdrChunk.getBuffer (), acTLCunk.getBuffer (), body, IENDCunk.getBuffer ()]);
  fs.writeFileSync ('output.png', apngData);
};
run ();