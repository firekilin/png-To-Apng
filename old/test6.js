const zlib = require ('zlib');
const fs = require ('fs');

let img = (Buffer.from (fs.readFileSync ('11.png')));



let getCunkDetail = (pngFile, typeName) => {
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
    if (type === typeName) {
      let idatData = pngFile.slice (offset, offset + length);
      return idatData;
    }
    
    // 更新偏移量以跳过当前块
    offset += length;
    
    // 跳过 CRC（循环冗余校验）校验码的4个字节
    offset += 4;
  }
};
  
// 输入的IDAT数据块
const idatData = getCunkDetail (img, 'IDAT');

// 解压缩IDAT数据
zlib.inflate (idatData, (err, inflatedData) => {
  if (err) {
    console.error ('解压缩出错：', err);
    return;
  }
  console.log ('解压缩后的数据：', inflatedData.toString ('hex'));
});