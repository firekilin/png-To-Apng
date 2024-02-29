const fs = require ('fs');
const PNG = require ('pngjs').PNG;

// 读取 PNG 文件
fs.createReadStream ('1.png')
  .pipe (new PNG ())
  .on ('parsed', function() {
    // PNG 文件已解析完成
    console.log ('Width:', this.width);
    console.log ('Height:', this.height);
    console.log (this.data);
    
    // 将 Buffer 转换为十六进制字符串
    const hexString = this.data.toString ('hex');


    // 将十六进制字符串写入文本文件
    fs.writeFileSync ('1_test.txt', hexString);
    
  })
  .on ('error', function(err) {
    // 发生错误时的处理
    console.error ('Error:', err);
  });