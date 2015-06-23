'use strict';

var path = require("path");

var MediaTransformation = require("./mediaTransformation");

/**
 * This is the MediaJuggle testing script.
 To use it, you just run it without parameters:
 *
 * ```js
 * node 
 * ```
 */

// var fileName = "Lolita audiobook Part 1 Chapter 1.mp3";
// var fileNameChunk = "Lolita audiobook Part 1 Chapter 1 - 01-t.mp3";
// var fileNameTimeChunk = "Lolita audiobook Part 1 Chapter 1 - 01.mp3";
// var numberSetFolder = path.resolve(__dirname + "/" + "data/infoSounds/sasha");
// var fileNameTime = numberSetFolder + "/" + "001-stereo.mp3";

var demo_type = "get_params";
console.log("Doing demo: '%s'", demo_type);

switch(demo_type){
case "chunk":
	var fileName = "01-17.mp3";
	var fileNameChunk = "01-17-t.mp3";
	var fileNameTimeChunk = "01-17 - 01.mp3";
	var numberSetFolder = path.resolve(__dirname + "/" + "data/infoSounds/sasha");
	// var numberSetFolder = path.resolve(__dirname + "/" + "data/dr-zivago/sasha");
	var fileNameTime = numberSetFolder + "/" + "001-stereo.mp3";
	// var fileNameTime = numberSetFolder + "/" + "001-stereo-f.mp3";

	var init = function(mediaTransformation){
		var folderName = process.argv[2] || 'data/dr-zivago';
		var listFileName = process.argv[3] || 'list.txt';

		mediaTransformation.init(folderName, listFileName, numberSetFolder);
	};

	var mediaTransformation = new MediaTransformation();
	init(mediaTransformation);

	mediaTransformation.getMediaLength(fileName, function(lengthSec){
		console.log("fileName '%s' length: %s sec", fileName, lengthSec);
		mediaTransformation.createMediaChunk(fileName, mediaTransformation.getFullPathTemp(fileNameChunk), 5, 25, function (){
			console.log("fileName '%s' is chunked", fileName);
			var fillNamesIn = [fileNameTime, mediaTransformation.getFullPathTemp(fileNameChunk)];
			mediaTransformation.concatenateMedia(fillNamesIn, mediaTransformation.getFullPathOut(fileNameTimeChunk), function(){
				console.log("fileName '%s' is extended with time", fileName);
			})
		});
	});
	break;

case "reencode":
	var numberSetFolder = path.resolve(__dirname + "/" + "data/dr-zivago/sasha");
	var fileNameTimeIn = numberSetFolder + "/" + "001-stereo.mp3";
	var fileNameTimeOut = numberSetFolder + "/" + "001-stereo-f.mp3";

	var init = function(mediaTransformation){
		var folderName = process.argv[2] || 'data/dr-zivago';
		var listFileName = process.argv[3] || 'list.txt';

		mediaTransformation.init(folderName, listFileName, numberSetFolder);
	};

	var mediaTransformation = new MediaTransformation();
	init(mediaTransformation);

	var options = {
		f: "mp3",
		ar: 24000,
		ac: 2,
		ab: "64k",
		acodec: "libmp3lame"
	};

	mediaTransformation.reencodeMedia(fileNameTimeIn, fileNameTimeOut, options, function(fileNameTimeOut){
		console.log("fileName '%s' reencoded", fileNameTimeIn);
	});
	break;
case "get_params":
	var fileName = "01-17.mp3";

	var init = function(mediaTransformation){
		var folderName = process.argv[2] || 'data/dr-zivago';
		var listFileName = process.argv[3] || 'list.txt';

		mediaTransformation.init(folderName, listFileName, numberSetFolder);
	};

	var mediaTransformation = new MediaTransformation();
	init(mediaTransformation);

	mediaTransformation.getMediaParams(fileName, function(mediaParams){
		console.log("mediaParams '%s'", JSON.stringify(mediaParams));
	});
	break;
}

// ffmpeg -i data/Lolita\ audiobook\ Part\ 1\ Chapter\ 1.mp3