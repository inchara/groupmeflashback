
var imgArray = new Array();
var filesarr;
var ctx = 0;
var video ;
var context;
var canvas;
var imagePartHeight=480;
var imagePartWidth=640;
var canvasHeight=480;// To allow for text
var textStartX=5;
var textStartY=455;
var start_time = +new Date;
(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

function generateVideo() {

    /* Drag'n drop stuff */
    var createvideo = document.getElementById("createvideo");
    //var files = getImages();


    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    context.save();
    //image to video via Whammy

    filesarr = getImages();


    createvideo.addEventListener("click", function() {
        start_time = +new Date;
        document.getElementById('status').innerHTML = "Working... Please Wait. If there are lots of pictures, this is going to take a while - You could come back to it in some time.";
        document.getElementById('download').style.visibility = "hidden";

        ctx = 0;

        canvas.width = imagePartWidth;
        canvas.height = canvasHeight;
        video = new Whammy.Video(15);

        //if we have images loaded
        if(filesarr.length>0){

            //loop through them and process
            for(var i = 0 ; i < filesarr.length; i++) {
                if(filesarr[i].url.match(/*.jpeg*/)){
                    process(filesarr[i],i);
                } else {
                    document.getElementById('status').innerHTML = "This file does not seem to be a image.";
                }
            }

        } else {
            document.getElementById('status').innerHTML = "Please select some images.";
        }

    }, false);
}

/* main process function */
function process(file,index) {
    var reader = new FileReader();
    reader.onload = function(event) {
        var dataUri = event.target.result;
        var img = new Image();

        //load image and drop into canvas
        img.onload = function() {
                imgArray[index] = img;

                ctx++;
                if(ctx==filesarr.length){
                  compileAllVideos();
                }
        };

        img.src = dataUri;
        img.onerror = function(event) {
           console.error ("Image could not be read" + event.target.error.code);
        }

    };

    reader.onerror = function(event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };

    var xhr = new XMLHttpRequest();

    xhr.open('GET', "proxy.php?csurl=" + file.url , true);
    xhr.setRequestHeader("Content-Type", "image/webp");
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      if (this.status == 200) {
        var blob = new Blob([this.response], {type: 'image/jpeg'});
        reader.readAsDataURL(blob);
      }
    };
    xhr.send();
}


function compileAllVideos() {
        for(i=imgArray.length-1 ; i>= 0;i--) {
            compileVideo(i);
        }

    var byteArray;
    video.compile(byteArray, outputVideo );
}
function compileVideo(index) {
    var img = imgArray[index];
    var dx=0;
    var imageWidth = canvas.width, imageHeight = imagePartHeight;
    if (img.height > imagePartHeight) {
        imageWidth = (img.width/img.height) * imagePartHeight;
        imageHeight = imagePartHeight;
        dx = (canvas.width - imageWidth) / 2;
    }

    var videoSpeed = document.getElementById("videoSpeed").value;
    context.globalAlpha = 1;
    context.fillStyle = "white";
    context.fillRect(0,0,context.canvas.width,context.canvas.height);
    context.strokeStyle = 'black';  // some color/style
    context.lineWidth = 10;         // thickness
    context.strokeRect(dx, 0, imageWidth, imagePartHeight);
    context.drawImage(img, 0, 0, img.width, img.height, dx, 0, /*canvas.width*/imageWidth, imagePartHeight);

    addText("  " + filesarr[index].text);
    if (videoSpeed==0 || videoSpeed == 1) {
        // Normal
        for (iterator=0; iterator<4; iterator++) {
                    video.add(context);
        }

    } else if (videoSpeed==2) {
        // Super fast so don't add context
    } else if (videoSpeed == 3) {
        // Super slow , add it five more times than you would normally

        for (iterator=0; iterator<20; iterator++) {
            video.add(context);
        }
    }
    video.add(context);
    video.add(context);
    video.add(context);
    video.add(context);
    /*
    context.clearRect(0,0,context.canvas.width,context.canvas.height);
    context.globalAlpha = 0.8;
    context.drawImage(img, dx, 0, img.width, img.height, 0, 0, canvas.width, imagePartHeight);
    addText(filesarr[index].text);

    video.add(context);*/
    ctx++;

}
function addText(text) {

    context.fillStyle = "black";
    height = 20*(text.length/60);
    context.globalAlpha=0.5;
    context.fillRect(textStartX, textStartY-height-20, canvas.width, 200);

    context.globalAlpha=1;
    context.fillStyle = "white";
    wrapText(text, 60);
    //context.fillText(text, textStartX, textStartY);

    context.font = "16px Verdana";
    wrapText(text, textStartX, textStartY-height, canvas.width, 20);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = context.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, y);
      }

//check if its ready
function outputVideo(videoFile) {
  var end_time = +new Date;
  var url =  webkitURL.createObjectURL(videoFile);

  //document.getElementById('videoPlace').innerHTML = '<video id="actualVideo" controls autoplay loop src="' + url + '"></video>';
  document.getElementById('download').style.visibility = "visible";
  document.getElementById('download').href = url;
  document.getElementById('status').innerHTML = "Compiled Video in " + (end_time - start_time) + "ms, file size: " + Math.ceil(videoFile.size / 1024) + "KB";

}