const {
  cunk, RGBA, PETL, gifPETL, gifRGBA, getApng
} = require ('./utils');
/*
pngSignature
IHDR
acTL 圖案標頭 控制動畫
fcTL 第一張圖標頭
IDAT(fdAT) 第一張圖
fcTL 第二張圖標頭
fdAT 第二張圖
fcTL 第三張圖標頭
fdAT 第三張圖
*/

/**
 * 客製化
 * @param {Number} imgLen 
 * @param {Object} args 
 * ````
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
````
 * @returns 
 */
let option = (imgLen, args) => {
  let def = {
    bitDepth: 8, // 顏色深度
    colorType: 3, // 顏色類型
    compressionMethod: 0, // 壓縮方法
    filterMethod: 0, // 濾波器
    interlaceMethod: 0, // 隔行掃描方式
    numPlays: 0, // 設定循環次數 0為無限次
    allDelayNum: null, //如果有值 統一秒數 百分之X秒
    allBlendOp: null, //如果有值 統一混色
    fc: null
  };
  Object.assign (def, args);
  let fc = [];
 
  for (let i = 0;i < imgLen;i ++){
    let fcInfo = {
      xOffset: 0, // X 偏移
      yOffset: 0, // Y 偏移
      delayNum: 20, // 延遲時間分子
      delayDen: 100, // 延遲時間分母
      disposeOp: 0, // Dispose 操作 0不進行處理 1完全清除 2 渲染回上一個
      blendOp: 1, // Blend 操作 0覆蓋所有顏色  1混和顏色
    };
    if (args.allDelayNum){
      fcInfo.delayNum = args.allDelayNum;
      fcInfo.delayDen = 100;
    }
    if (args.allBlendOp){
      fcInfo.blendOp = args.allBlendOp;
    }
    if (args.fc != null && args.fc.length > i){
      fc.push (Object.assign (fcInfo, args.fc[i]));
    } else {
      fc.push (fcInfo);
    }
  }
  def.fc = fc;
  return def;
};

/**
 * png to Apng use RGBA to save
 * @param {Buffer[]} pngBufferList
 * @returns Apng Buffer
 */
exports.pngToApngRGBA = async(imagesBuffer, args) => {
  let imgBuffer = await RGBA (imagesBuffer);
  let setting = { colorType: 6, allBlendOp: 0 };
  Object.assign (setting, args);
  let def = option (imgBuffer.length, setting);
  return await getApng ( imgBuffer, def);

};

/**
 * png to Apng use PLTE to save
 * @param {Buffer[]} pngBufferList
 * @returns Apng Buffer
 */
exports.pngToApngPLTE = async(imagesBuffer, args) => {
  let imgBuffer = await PETL (imagesBuffer);
  let setting = { colorType: 3, allBlendOp: 0 };
  Object.assign (setting, args);
  let def = option (imgBuffer.length, setting);
  return await getApng ( imgBuffer, def);

};

/**
 * gif to Apng use PLTE to save
 * @param {Buffer} gifBuffer
 * @returns Apng Buffer
 */
exports.gifToApngRGBA = async(imagesBuffer, args) => {
  let imgBuffer = await gifRGBA (imagesBuffer);
  let setting = { colorType: 6, allBlendOp: 1 };
  Object.assign (setting, args);
  let def = option (imgBuffer.length, setting);

  return await getApng ( imgBuffer, def);

};



/**
 * gif to Apng use PLTE to save
 * @param {Buffer} gifBuffer
 * @returns Apng Buffer
 */
exports.gifToApngPLTE = async(imagesBuffer, args) => {
  let imgBuffer = await gifPETL (imagesBuffer);
  let setting = { colorType: 3, allBlendOp: 1 };
  Object.assign (setting, args);
  let def = option (imgBuffer.length, setting);

  return await getApng ( imgBuffer, def);
};






module.exports = exports;