const fs = require ('fs');

let demo = require ('./index');

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
  // //gifToApng RGBA
  await demo.gifToApngRGBA (gifImgBuffer).then (data => {
    fs.writeFileSync ('./output/output3.png', data);
  
  });

  // //gifToApng PLTE 
  await demo.gifToApngPLTE (gifImgBuffer).then (data => {
    fs.writeFileSync ('./output/output4.png', data);
  
  });

};
run ();