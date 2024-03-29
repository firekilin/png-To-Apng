const crc = require ('crc'); // 引入crc库
const { Readable } = require ('stream');
const PNG = require ('pngjs').PNG;
const zlib = require ('zlib');
const fs = require ('fs');
const GIFReader = require ('gif-frames');
/**組成cunk*/
class cunk{
  /**cunk
     * @param {String} Type 類型 IHDR、acTL等等
     * @param {Buffer} Body 內容
     * @returns  含有數量大小 類型 內容 CRC 使用getBuffer()
    */
  constructor(Type, Body){
    this.len = Buffer.alloc (4); // 建立 Buffer
    this.len.writeUint32BE ( Body.length, 0);
    this.type = Buffer.alloc (4);
    this.type.write (Type, 0, 'ascii');
    this.body = Body;
    let crcTemp = Buffer.alloc ( this.type.length + this.body.length);
    this.type.copy (crcTemp, 0);
    this.body.copy (crcTemp, 4);
    let crcStr = crc.crc32 (crcTemp);
    this.crcBuffer = Buffer.alloc (4);
    this.crcBuffer.writeUInt32BE (crcStr, 0);
  }
  /**
     * @returns {Buffer}含有數量大小 類型 內容 CRC
     */
  getBuffer(){
    return Buffer.concat ([this.len, this.type, this.body, this.crcBuffer]); 
  }
}


/**
 * to Apng use PLTE to save
 * @param {Object} arges 
 * 
 ````
  {
    bitDepth: 8, // 顏色深度
    colorType: 6, // 顏色類型
    compressionMethod: 0, // 壓縮方法
    filterMethod: 0, // 濾波器
    interlaceMethod: 0, // 隔行掃描方式
    numPlays: 0, // 設定循環次數 0為無限次
    fc: [{
      xOffset: 0, // X 偏移
      yOffset: 0, // Y 偏移
      delayNum: 20, // 延遲時間分子
      delayDen: 100, // 延遲時間分母
      disposeOp: 0, // Dispose 操作 0不進行處理 1完全清除 2 渲染回上一個
      blendOp: 0, // Blend 操作 0覆蓋所有顏色  1混和顏色
    }]
  }
````
 * @param {Buffer} gifBuffer
 * @returns Apng Buffer
 */
let getApng = async(imgBuffer, arges) => {

  //step 1 pngSignature
  const pngSignature = Buffer.from ([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  //step 2 create IHDR
  const width = imgBuffer.width; // 寬度
  const height = imgBuffer.height; // 高度

  const ihdr = Buffer.alloc (13); // 建立 Buffer
  ihdr.writeUInt32BE (width, 0); // 寬度
  ihdr.writeUInt32BE (height, 4); // 高度
  ihdr.writeUInt8 (arges.bitDepth, 8); // 顏色深度
  ihdr.writeUInt8 (arges.colorType, 9); // 顏色類型
  ihdr.writeUInt8 (arges.compressionMethod, 10); // 壓縮方法
  ihdr.writeUInt8 (arges.filterMethod, 11); // 濾波器
  ihdr.writeUInt8 (arges.interlaceMethod, 12); // 隔行掃描方式
  const ihdrChunk = new cunk ('IHDR', ihdr);
  
  //step 3 create acTL
  const numFrames = imgBuffer.length; // 設定數量
  const acTL = Buffer.alloc (8);
  acTL.writeUInt32BE (numFrames, 0);
  acTL.writeUInt32BE (arges.numPlays, 4);
  const acTLCunk = new cunk ('acTL', acTL);

  let PLTECunk = null;
  let tRNSCunk = null;
  if (imgBuffer.PLTE){
    PLTECunk = new cunk ('PLTE', Buffer.concat (imgBuffer.PLTE));
  }
  if (imgBuffer.tRNS){
    tRNSCunk = new cunk ('tRNS', Buffer.concat ( imgBuffer.tRNS));
  }

  //step 6 迴圈 第一圈 圖片 IDAT
  let sequenceNumber = 0; // 序號

    
  let bodyBuffer = [];
  for (let i = 0;i < imgBuffer.fileBuffer.length;i ++){
    let fcTL = Buffer.alloc (26);
    fcTL.writeUInt32BE (sequenceNumber, 0);
    fcTL.writeUInt32BE (width, 4);
    fcTL.writeUInt32BE (height, 8);
    fcTL.writeUInt32BE (arges.fc[i].xOffset, 12);
    fcTL.writeUInt32BE (arges.fc[i].yOffset, 16);
    fcTL.writeUint16BE (arges.fc[i].delayNum, 20);
    fcTL.writeUint16BE (arges.fc[i].delayDen, 22);
    fcTL.writeInt8 (arges.fc[i].disposeOp, 24);
    fcTL.writeInt8 (arges.fc[i].blendOp, 25);
    let fcTLCunk = new cunk ('fcTL', fcTL);
    sequenceNumber ++;
    bodyBuffer.push (fcTLCunk.getBuffer ());
    if (i == 0){

      let IDAT = new cunk ('IDAT', imgBuffer.fileBuffer[i]);
      bodyBuffer.push (IDAT.getBuffer ());
    } else {
      let fdAT = Buffer.alloc (imgBuffer.fileBuffer[i].length + 4);
      fdAT.writeUInt32BE (sequenceNumber, 0);
      imgBuffer.fileBuffer[i].copy (fdAT, 4);
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
  let apngData = null;
  if (PLTECunk ){
    apngData = Buffer.concat ([pngSignature,
      ihdrChunk.getBuffer (),
      acTLCunk.getBuffer (),
      PLTECunk.getBuffer (),
      tRNSCunk.getBuffer (),
      body,
      IENDCunk.getBuffer ()]);
  } else {
    apngData = Buffer.concat ([pngSignature,
      ihdrChunk.getBuffer (),
      acTLCunk.getBuffer (),
      body,
      IENDCunk.getBuffer ()]);
  }
 
  return apngData;
};





class BufferToStream extends Readable {
  constructor(buffer) {
    super ();
    this.buffer = buffer;
    this.pos = 0;
  }
  _read() {
    if (this.pos >= this.buffer.length) {
      this.push (null);
      return;
    }
    this.push (this.buffer.slice (this.pos, this.pos + 1));
    this.pos ++;
  }
}

/**
 * 取得解析圖片
 * @param {Buffer} file 
 * @returns data,width,height
 */
let getImgFileData = (file) => {
  return new Promise ((resolve, reject) => {
    let imgStream = new BufferToStream (file);
    imgStream.pipe (new PNG ()).on ('parsed', function() {
      resolve ({
        data: this.data, width: this.width, height: this.height
      });
    }).on ('error', function(err) {
      console.error ('Error:', err);
    });
  });
};

/**
 * 壓縮
 * @param {Buffer} 圖片源代碼
 * @returns {Buffer}
 */
let getZlibDeflate = (bf) => {
  return new Promise ((resolve, reject) => {
    zlib.deflate (bf, (err, compressedData) => {
      if (err) {
        console.error ('壓縮錯誤:', err);
        return;
      }
      resolve (compressedData);
    });
  });
};


let RGBA = async (files) => {
  let fileBuffer = [];
  let width = 0;
  let height = 0;
  let length = files.length;
  for (let i = 0;i < files.length;i ++){

    let img = await getImgFileData (files[i]);
    if (width != 0 && width != img.width || height != 0 && height != img.height){
      throw 'errorSize';
    } else {
      width = img.width;
      height = img.height;
    }
    // PNG 文件已解析完成
    const pngBuffer = img.data;
    const modifiedData = [];
    const bytesPerRow = img.width * 4; // 每個點占用4字節

    // 將每行進行處理
    for (let i = 0; i < img.height; i ++) {
      const startIndex = i * bytesPerRow;
      const rowData = pngBuffer.slice (startIndex, startIndex + bytesPerRow);
      // 行首的 '00'  使用原始RGB 方式 #ffffffff
      let test = Buffer.alloc (1);
      test.writeUInt8 (0, 0);
      modifiedData.push (test);
      // 添加原始資料 #ffffffff
      modifiedData.push (rowData);
          
    }
    // 合并所有数据并创建新的 Buffer
    const modifiedBuffer = Buffer.concat (modifiedData);
    fileBuffer.push (await getZlibDeflate (modifiedBuffer));
  }
  return {
    fileBuffer: fileBuffer, width: width, height: height, length: length
  };
};


let PETL = async (files) => {
  let PLTE = []; //PLTE取得 無透明色 使用 push
  let tRNS = []; //tRNS取得 有透明色 使用 unshift 並且 unshift RGB 倒PLTE
  let PLTEtRNS = []; //兩者皆保存用於運算
  let width = 0;
  let height = 0;
  let length = files.length;
  for (let i = 0;i < files.length;i ++){
    let img = await getImgFileData (files[i]);
    if (width != 0 && width != img.width || height != 0 && height != img.height){
      throw 'errorSize';
    } else {
      width = img.width;
      height = img.height;
    }
    // PNG 文件已解析完成
    let pngBuffer = img.data;
    for (let j = 0; j < pngBuffer.length; j += 4) {
      let rgb = pngBuffer.slice (j, j + 3);
      let a = pngBuffer.slice (j + 3, j + 4);
      let rgba = pngBuffer.slice (j, j + 4);
      // 添加顏色到 PLTE，如果不是透明的話      console.log ();

      if (a.equals (Buffer.from ([0xff]))) {
        let isinCludes = false;
        PLTEtRNS.forEach (item => {
          if (item.equals (rgba)){
            isinCludes = true;
          }});
        if (! isinCludes){
          PLTEtRNS.push (rgba);
          PLTE.push (rgb);
        } 
      }
      // 添加透明度到 tRNS
      if (! a.equals (Buffer.from ([0xff]))) {
        let isinCludes = false;
        PLTEtRNS.forEach (item => {
          if (item.equals (rgba)){
            isinCludes = true;
          }});
        if (! isinCludes){
          PLTEtRNS.unshift (rgba);
          tRNS.unshift (a);
          PLTE.unshift (rgb);
        } 
      }
    }
  }

  let fileBuffer = [];
  for (let i = 0;i < files.length;i ++){
    let img = await getImgFileData (files[i]);
    // PNG 文件已解析完成
    let pngBuffer = img.data;
    let buffer = [];
    for (let j = 0; j < pngBuffer.length; j += 4) {
      let rgba = pngBuffer.slice (j, j + 4);
      if (j % (4 * img.width) == 0){
        let lineFirst = Buffer.alloc (1);
        lineFirst.writeUInt8 (0, 0);
        buffer.push (lineFirst);
      }
      let getNum = 0;
      let getNewnum = 0;
      PLTEtRNS.forEach (item => {
        if (item.equals (rgba)){
          getNewnum = getNum;
        }
        getNum ++;
      });
      let point = Buffer.alloc (1);
      point.writeUInt8 ( parseInt (getNewnum), 0);
      buffer.push (point);
    }
    let modifiedBuffer = Buffer.concat (buffer);

    fileBuffer.push (await getZlibDeflate (modifiedBuffer));
        
  }
  return {
    PLTE: PLTE, tRNS: tRNS, fileBuffer: fileBuffer, width: width, height: height, length: length
  };
    
};


let gifToPngList = async(inputGifBuffer) => {
  // 将 GIF 缓冲区写入临时文件
  const tempGifPath = 'temp.gif';
  fs.writeFileSync (tempGifPath, inputGifBuffer);

  // 从临时文件读取 GIF 数据并转换为 PNG

  const frames = await GIFReader ({
    url: tempGifPath, frames: 'all', outputType: 'png' 
  });

  let pngBuffers = [];
  for (let index = 0; index < frames.length; index ++) {
    const frameData = frames[index];
    const png = new PNG ({
      width: frameData.frameInfo.width,
      height: frameData.frameInfo.height,
      bitDepth: 8,
      colorType: 6 // RGBA
    });

    png.data = await frameData.getImage ().data;
    // 将 PNG 数据存储在内存中的 Buffer 数组中
    const pngBuffer = await new Promise ((resolve, reject) => {
      const buffers = [];
      png.pack ().on ('data', (data) => {return buffers.push (data);})
        .on ('end', () => {return resolve (Buffer.concat (buffers));})
        .on ('error', reject);
    });
    pngBuffers.push (pngBuffer);
  }

  // 删除临时文件
  fs.unlinkSync (tempGifPath);
  return pngBuffers;
};

let gifRGBA = async (inputGifBuffer) => {
  let pngBuffers = await gifToPngList (inputGifBuffer);
  return await RGBA (pngBuffers);
};

let gifPETL = async (inputGifBuffer) => {
  let pngBuffers = await gifToPngList (inputGifBuffer);
  return await PETL (pngBuffers);
};



module.exports = {
  cunk: cunk,
  RGBA: RGBA,
  PETL: PETL,
  gifRGBA: gifRGBA,
  gifPETL: gifPETL,
  getApng: getApng
};