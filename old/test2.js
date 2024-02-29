const fs = require ('fs');


// 读取 PNG 文件为 Buffer
const pngBuffer = fs.readFileSync ('000.png');

// 将 Buffer 转换为十六进制字符串
const hexString = pngBuffer.toString ('hex');


// 将十六进制字符串写入文本文件
fs.writeFileSync ('000.txt', hexString);

console.log ('PNG 文件已转换为文本文件 000.txt');