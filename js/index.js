'use strict'
var inTime = -1;

var PubSub = new (function() {
  var events = {};
   
  this.publish = function(name, data) {
    var handlers = events[name];
    if(!!handlers === false) return;
    handlers.forEach(function(handler) {
      handler.call(this, data);
    });
  };

  this.subscribe = function(name, handler) {
    var handlers = events[name];
    if(!!handlers === false) {
      handlers = events[name] = [];
    }
    handlers.push(handler);
  };

  this.unsubscribe = function(name, handler) {
    var handlers = events[name];
    if(!!handlers === false) return;

    var handlerIdx = handlers.indexOf(handler);
    handlers.splice(handlerIdx);
  };
});


const video = document.getElementById("uservideo");
const vcanvas = document.getElementById("videocanvas");

var mySubscriber = function (data) {	
	var btn = document.getElementById("test_btn");
	var curRect = btn.getBoundingClientRect()
	if(data && data.x && data.y){		
		if(data.x >= curRect.left && data.x <= curRect.right &&
		 data.y >= curRect.top && data.y <= curRect.bottom){
			 if(inTime === -1){
				 inTime = data.time;
				 console.log("Countdown Starts")
			 }
			 else if(Math.abs(inTime - data.time) > 3){
				alert("Clicked after 3 seconds");
				inTime = -1;
			 }
		 } else {
			 console.log("reset -> Oustide box")
			 inTime = -1;
		 }
	}
};

PubSub.subscribe('mytopic', mySubscriber);

// use getBoundingClientRect() to find current element's postion
var prevx = 0;
var prevy = 0;

let imgindex = 1
let isVideo = false;
let model = null;

const modelParams = {
	flipHorizontal: true,   // flip e.g for video  
	maxNumBoxes: 1,        // maximum number of boxes to detect
	iouThreshold: 0.5,      // ioU threshold for non-max suppression
	scoreThreshold: 0.9,    // confidence threshold for predictions.
}

video.addEventListener('playing', function() {
    if (this.videoWidth === 0) {
		console.error('videoWidth is 0. Camera not connected?');		
	}
	else{
		video.width = this.videoWidth;
    	video.height = this.videoHeight;
		isVideo = true;
		runDetection();
	}
}, false);

handTrack.load(modelParams).then(lmodel => {
	// detect objects in the image.
	model = lmodel;
	handTrack.startVideo(video)
});

function runDetection() {
	model.detect(video).then(predictions => {
		model.renderPredictions(predictions, vcanvas, video, 0.5);

		if (predictions[0]) {
			//console.log("Predictions: ", predictions);
		
			const xbuffer = 150;
			const ybuffer = 100;
			const flicker = 7;
			var midx = predictions[0].bbox[0] + (predictions[0].bbox[2] / 2);
			var midy = predictions[0].bbox[1] + (predictions[0].bbox[3] / 2);
			midx = (midx / video.width) * window.innerWidth;
			midy = (midy / video.height) * window.innerHeight;
			midx = ((midx - xbuffer) / (window.innerWidth - 2 * xbuffer)) * window.innerWidth;
			midy = ((midy - ybuffer) / (window.innerHeight - 2 * ybuffer)) * window.innerHeight;

			//remove flickering			
			if (Math.abs(midx - prevx) > flicker) //significant change
			{
				prevx = midx;
			}

			if (Math.abs(midy - prevy) > flicker) //significant change
			{
				prevy = midy;
			}
			
			document.getElementById("cursor_icon").style.top=Math.round(prevy)+'px';
			document.getElementById("cursor_icon").style.left=Math.round(prevx)+'px';
			var pos = {
				"x":Math.round(prevx),
				"y":Math.round(prevy),
				"time": (new Date().getTime() / 1000)
			};
			
			PubSub.publish('mytopic', pos);
		}

		if (isVideo) {
			requestAnimationFrame(runDetection);
		}
	});
}