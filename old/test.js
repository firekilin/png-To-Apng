const crc = require ('crc'); // 引入crc库
const fs = require ('fs');


let getIDAT = (pngFile) => {
  // 定义变量来跟踪当前的偏移量
  let offset = 8; // 跳过 PNG 文件头部的8个字节
  
  // 循环解析 PNG 文件的各个块，直到找到 IDAT 块
  while (offset < pngFile.length) {
    // 读取当前块的长度
    const length = pngFile.readUInt32BE (offset);
    offset += 4;
  
    // 读取当前块的类型
    const type = pngFile.toString ('utf8', offset, offset + 4);
    offset += 4;
  
    // 如果当前块是 IDAT 块，则提取数据并输出
    if (type === 'IDAT') {
      const idatData = pngFile.slice (offset, offset + length);
      return idatData;
    }
  
    // 更新偏移量以跳过当前块
    offset += length;
  
    // 跳过 CRC（循环冗余校验）校验码的4个字节
    offset += 4;
  }
};
  
const pngImage = Buffer.from (fs.readFileSync ('poohEat.png'));
console.log (pngImage);

// step0 get png
const pngImage1 = Buffer.from (fs.readFileSync ('1.png'));
const pngImage2 = Buffer.from (fs.readFileSync ('2.png'));
/**
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
const pngSignature = Buffer.from ([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);



//step1 create IHDR
const width = 130; // 图像宽度
const height = 120; // 图像高度
const bitDepth = 8; // 位深度，通常为 8
const colorType = 3; // 颜色类型，通常为 6（真彩色）
const compressionMethod = 0; // 压缩方法，通常为 0（deflate/inflate 压缩）
const filterMethod = 0; // 滤波器方法，通常为 0（adaptive filtering）
const interlaceMethod = 0; // 隔行扫描方法，通常为 0（不使用隔行扫描）

// 创建 IHDR 块的 Buffer
const ihdrChunk = Buffer.from ([
  // 长度字段
  0,
  0,
  0,
  13,
  // 类型字段
  73,
  72,
  68,
  82, // "IHDR"
  // 图像宽度（4 字节）
  (width >> 24) & 0xFF,
  (width >> 16) & 0xFF,
  (width >> 8) & 0xFF,
  width & 0xFF,
  // 图像高度（4 字节）
  (height >> 24) & 0xFF,
  (height >> 16) & 0xFF,
  (height >> 8) & 0xFF,
  height & 0xFF,
  // 位深度（1 字节）
  bitDepth,
  // 颜色类型（1 字节）
  colorType,
  // 压缩方法（1 字节）
  compressionMethod,
  // 滤波器方法（1 字节）
  filterMethod,
  // 隔行扫描方法（1 字节）
  interlaceMethod
]);



// step2 create acTL
const numFrames = 2; // 設定數量
const numPlays = 0; // 設定循環次數 0為無限次
// 建立acTL
const acTLChunk = Buffer.from ([
  //轉換成4字節無符號整數
  numFrames & 0xFF,
  (numFrames >> 8) & 0xFF,
  (numFrames >> 16) & 0xFF,
  (numFrames >> 24) & 0xFF,
  // 撥放次數轉換成4字節無符號整數
  numPlays & 0xFF,
  (numPlays >> 8) & 0xFF,
  (numPlays >> 16) & 0xFF,
  (numPlays >> 24) & 0xFF,
]);



//step3 create fcTL
const sequenceNumber = 0; // 序號
const xOffset = 0; // X 偏移
const yOffset = 0; // Y 偏移
const delayNum = 1; // 延遲時間分子
const delayDen = 100; // 延遲時間分母
const disposeOp = 0; // Dispose 操作    0不進行處理 1完全清除 2 渲染回上一個
const blendOp = 0; // Blend 操作        0覆蓋所有顏色  1混和顏色

const frame1_fcTL = Buffer.from ([
  // sequence_number (unsigned int)
  sequenceNumber & 0xFF,
  (sequenceNumber >> 8) & 0xFF,
  (sequenceNumber >> 16) & 0xFF,
  (sequenceNumber >> 24) & 0xFF,
  // width (unsigned int)
  width & 0xFF,
  (width >> 8) & 0xFF,
  (width >> 16) & 0xFF,
  (width >> 24) & 0xFF,
  // height (unsigned int)
  height & 0xFF,
  (height >> 8) & 0xFF,
  (height >> 16) & 0xFF,
  (height >> 24) & 0xFF,
  // x_offset (unsigned int)
  xOffset & 0xFF,
  (xOffset >> 8) & 0xFF,
  (xOffset >> 16) & 0xFF,
  (xOffset >> 24) & 0xFF,
  // y_offset (unsigned int)
  yOffset & 0xFF,
  (yOffset >> 8) & 0xFF,
  (yOffset >> 16) & 0xFF,
  (yOffset >> 24) & 0xFF,
  // delay_num (unsigned short)
  delayNum & 0xFF,
  (delayNum >> 8) & 0xFF,
  // delay_den (unsigned short)
  delayDen & 0xFF,
  (delayDen >> 8) & 0xFF,
  // dispose_op (byte)
  disposeOp,
  // blend_op (byte)
  blendOp
]);

//step4 create fdAT
const frame1_fdAT = Buffer.concat ([
  Buffer.from ('fdAT'), // 块类型
  Buffer.alloc (4), // 预留的4字节长度字段
  getIDAT (pngImage1) // PNG图像数据
]);
// 写入长度字段
frame1_fdAT.writeUInt32BE (frame1_fdAT.length - 12, 4);


//step4 create fdAT
// const frameDataSize = pngImage1.length;
// const frame1_fdAT = Buffer.alloc (4 + frameDataSize); // 建立大小
// frame1_fdAT.writeUInt32LE (sequenceNumber, 0);
// pngImage1.copy (frame1_fdAT, 4); 


//step5 copy img2
const sequenceNumber2 = 1; // 序號

const frame2_fcTL = Buffer.from ([
  // sequence_number (unsigned int)
  sequenceNumber2 & 0xFF,
  (sequenceNumber2 >> 8) & 0xFF,
  (sequenceNumber2 >> 16) & 0xFF,
  (sequenceNumber2 >> 24) & 0xFF,
  // width (unsigned int)
  width & 0xFF,
  (width >> 8) & 0xFF,
  (width >> 16) & 0xFF,
  (width >> 24) & 0xFF,
  // height (unsigned int)
  height & 0xFF,
  (height >> 8) & 0xFF,
  (height >> 16) & 0xFF,
  (height >> 24) & 0xFF,
  // x_offset (unsigned int)
  xOffset & 0xFF,
  (xOffset >> 8) & 0xFF,
  (xOffset >> 16) & 0xFF,
  (xOffset >> 24) & 0xFF,
  // y_offset (unsigned int)
  yOffset & 0xFF,
  (yOffset >> 8) & 0xFF,
  (yOffset >> 16) & 0xFF,
  (yOffset >> 24) & 0xFF,
  // delay_num (unsigned short)
  delayNum & 0xFF,
  (delayNum >> 8) & 0xFF,
  // delay_den (unsigned short)
  delayDen & 0xFF,
  (delayDen >> 8) & 0xFF,
  // dispose_op (byte)
  disposeOp,
  // blend_op (byte)
  blendOp
]);
const frame2_fdAT = Buffer.concat ([
  Buffer.from ('fdAT'), // 块类型
  Buffer.alloc (4), // 预留的4字节长度字段
  getIDAT (pngImage2) // PNG图像数据
]);
  // 写入长度字段
frame2_fdAT.writeUInt32BE (frame2_fdAT.length - 12, 4);

// 计算IHDR块的CRC校验码
const ihdrData = Buffer.concat ([ihdrChunk.slice (4), ihdrChunk.slice (12)]); // 不包含长度字段和类型字段
const ihdrCRC32 = crc.crc32 (ihdrData);

// 将计算得到的CRC校验码填充到IHDR块的CRC字段中
const ihdrCRCBuffer = Buffer.alloc (4);
ihdrCRCBuffer.writeUInt32BE (ihdrCRC32 >>> 0, 0);
ihdrCRCBuffer.copy (ihdrChunk, 21); // CRC字段在IHDR块中的偏移量为20

//step6 IEND
const iendChunk = Buffer.from ([
  0,
  0,
  0,
  0, // 长度字段，固定为 0
  73,
  69,
  78,
  68, // 类型字段，固定为 "IEND"
  // CRC 字段，可以先设置为 0，然后在计算 CRC 后填充正确的值
  0,
  0,
  0,
  0
]);

// 计算IEND块的CRC校验码
const iendCRC32 = crc.crc32 (iendChunk.slice (4, 8)); // 计算CRC时，不包含长度字段和类型字段
const iendCRCBuffer = Buffer.alloc (4);
iendCRCBuffer.writeUInt32BE (iendCRC32 >>> 0, 0); // 将CRC校验码写入Buffer

// 将计算得到的CRC校验码填充到IEND块的CRC字段中
iendCRCBuffer.copy (iendChunk, 8);

//step 7：将所有部分组合成一个APNG文件
const apngData = Buffer.concat ([pngSignature, ihdrChunk, acTLChunk, frame1_fcTL, frame1_fdAT, frame2_fcTL, frame2_fdAT, iendChunk]);
console.log (apngData);
fs.writeFileSync ('output.png', apngData);