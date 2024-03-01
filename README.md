#  pngToApng or gifToApng  轉動圖png
### [抖內](https://p.ecpay.com.tw/8E29ABF)

# pngToApng
````
  let demo = require ('./dist/index');
  //pngToApng RGBA
  demo.pngToApngRGBA (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output1.png', data);
  });

  //pngToApng PLTE
  demo.pngToApngPLTE (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output2.png', data);
  });
````
# gifToApng
````
  let demo = require ('./dist/index');
  //pngToApng RGBA
  demo.pngToApngRGBA (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output1.png', data);
  });

  //pngToApng PLTE
  demo.pngToApngPLTE (pngImgBuffer).then (data => {
    fs.writeFileSync ('./output/output2.png', data);
  });
````
# option
````
  /*  option
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
  demo.gifToApngRGBA (gifImgBuffer, 
    { 'numPlays': 5,
      'fc': [
        { 'delayNum': 10, 'delayDen': 100 },
        { 'delayNum': 20, 'delayDen': 100 }
      ] })
    .then (data => {
      fs.writeFileSync ('./output/output5.png', data);
    });

````




# 原理說明 PNG cunk 順序  個人筆記
````
png
	pngSignature 
	IHDR
	IDAT 
````
# pngSignature 固定 PNG類型
````
89 50 4E 47 0D 0A 1A 0A
````
# cunk 固定格式 除pngSignature外
````
byte(size)
	4   length 內容長度
	4   type   cunk 類型名稱 (IHDR、IDAT....)
	x   content 資料內容
	4   CRC	CRC32(type + content)
````
# IHDR Cunk 圖片基本資訊
````
byte
	0   width	寬度
	4   height	高度
	8   bitDepth	顏色深度 通常8
	9   colorType	顏色類型 通常 6（真彩色） APNG PLTE 需為 3
	10  compressionMethod	壓縮方法
	11  filterMethod	濾波器
	12  filterinterlaceMethodMethod	隔行掃描方式
````
# IDAT Cunk 圖片內容
````
byte
	0   圖片資訊

// 加密資料 使用pngjs解出為
// 00000000 00000000 00000000 這樣為三點陣 RGBA  無Flitering
````

# 原理說明 APNG cunk 順序
````
apng
	pngSignature
		89 50 4E 47 0D 0A 1A 0A
	IHDR
		寬度
		高度
		深度
		壓縮方法
		濾波器方法
		隔行掃描方式
	acTL
		幀數
		播放次數 0無限次
	PLTE
		顏色 色票
	tRNS
		透明度 (不清楚
	fcTL
		序號
		X 偏移
		Y 偏移
		延遲時間分子
		延遲時間分母
		Dispose 操作    0不進行處理 1完全清除 2 渲染回上一個
		Blend 操作        0覆蓋所有顏色  1混和顏色
	IDAT
		使用zlib解出
		01 00000000 00000000 00000000 這樣為三點陣 前面為換行時資訊
			Type	Name	Filter Function	Reconstruction Function
			0	None	Filt(x) = Orig(x)	Recon(x) = Filt(x)
			1	Sub	Filt(x) = Orig(x) - Orig(a)	Recon(x) = Filt(x) + Recon(a) 左側
			2	Up	Filt(x) = Orig(x) - Orig(b)	Recon(x) = Filt(x) + Recon(b) 上方
			3	Average	Filt(x) = Orig(x) - floor((Orig(a) + Orig(b)) / 2)	Recon(x) = Filt(x) + floor((Recon(a) + Recon(b)) / 2)
			4	Paeth	Filt(x) = Orig(x) - PaethPredictor(Orig(a), Orig(b), Orig(c))	Recon(x) = Filt(x) + PaethPredictor(Recon(a), Recon(b), Recon(c))
	fcTL
	fdAT(IDAT)
	fcTL
	fdAT(IDAT)
	....
````
	
# 我使用的PLTE方式	
````
將每張 png 解析出來

舉例
一張1*5的點陣圖
一般點陣方式為
點陣資訊
ff0000ff ff0000ff ffff00ff ffffffff ffff0008

轉為PLTE+trn

PLTE
ffff00
ff0000
ffff00
ffffff

tRNS
08

目前無使用filtering
點陣資訊將為
00 01 01 02 03 00


````
# filtering
````

使用filter方式進行儲存圖片
使用01 及 02 及 04
依照上方顏色 或 左方顏色 或 左上顏色 進行處理  03 過於複雜 不進行處理

````


