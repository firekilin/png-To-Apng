# 尚未完成
## 目前可以使用1.png 及 2.png

````
node index.js -> use RGBA  
node indexPLTE.js -> use PLTE tRNS ,  filtering all use 00 
````


png
	pngSignature
		89 50 4E 47 0D 0A 1A 0A
	IHDR
		寬度
		高度
		深度 通常6
		壓縮方法
		濾波器方法
		隔行掃描方式
	IDAT 
		圖片資料
		使用pngjs解出
		00000000 00000000 00000000 這樣為三點陣 無換行資訊

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
			
		
	TCAT
	
	TDAT
	
	
		



演算法(將一般png 解析出來)

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

點陣資訊為
01 01 00 01 01 fd


嘗試1 
先將圖片點陣資訊
保存進入PLTE 及 tRNS

PLTE=[]   PLTE取得 無透明色 使用 push
tRNS=[]   tRNS取得 有透明色 使用 unshift 並且 unshift RGB 倒PLTE
PLTEtRNS = [] 兩者皆保存用於運算

for (let i = 0; i < pixelData.length; i += 8) {
    let rgb=color.slice(i,i+6);
    let a=color.slice(i+6,i+8);
	let rgba =color.slice(i,i+8);

    // 添加顏色到 PLTE，如果不是透明的話
    if (a === 0xff) {
		if(!PLTEtRNS.includes(rgba){
			PLTEtRNS.push(rgba));
			PLTE.push(rgb);
		} 
    }

    // 添加透明度到 tRNS
    if (a < 0xff) {
		if(!PLTEtRNS.includes(rgba){
			PLTEtRNS.unshift(rgba));
			tRNS.unshift(a);
			PLTE.unshift(rgb);
		} 
    }
}

不使用filter 方式進行儲存 







使用filter方式進行儲存圖片
使用01 及 02 及 04
依照上方顏色 或 左方顏色 或 左上顏色 進行處理  03 過於複雜 不進行處理
