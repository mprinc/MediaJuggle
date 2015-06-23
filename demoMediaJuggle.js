'use strict';

var path = require("path");
var fs = require('fs');

var MediaJuggle = require("./mediaJuggle");
var mediaJuggle = new MediaJuggle();

// var demo_type = "reencode_folder";
var demo_type = "chunk_folder";

switch(demo_type){
case "reencode_folder":
	// var folderName = process.argv[2] || 'data/lolita-eng';
	var folderName = process.argv[2] || 'data/dr-zivago';
	var numberSetFolder = process.argv[3] || "/Users/sasha/Documents/data/development/mediaJuggle/data/infoSounds/sasha";
	var listFileName = process.argv[4] || 'list.json';

	mediaJuggle.init(folderName, listFileName).numberSetFolder(numberSetFolder).chunkLengthSec(60*7).indexAtTheStart(true);
	var mediaFile = "01-17.mp3";
	mediaJuggle.mediaTransformation.getMediaParams(mediaFile, function(params){
		var format = params.format;
		format.acodec = "libmp3lame";
		console.log("mediaFormatParams '%s'", JSON.stringify(format));
		mediaJuggle.reencodeFolder(numberSetFolder, "infoSounds/sasha", "mp3", format, function(folderNameOut){
			console.log("folder '%s' is reencoded", folderNameOut);
		});
	});
	break;

// node demoMediaJuggle.js data/dr-zivago list.json
// node demoMediaJuggle.js data/lolita-eng list.json
case "chunk_folder":
	// var folderName = process.argv[2] || 'data/lolita-eng';
	var folderName = process.argv[2] || 'data/dr-zivago';
	var listFileName = process.argv[3] || 'list.json';

	// mediaJuggle.getMediaInfo(fileName, function(mediaInfo){
	// 	console.log("fileName '%s' length: %s sec", mediaInfo.fileName(), mediaInfo.lengthSec());

	// 	// var globalChunk = 2;
	// 	// // doing single chunk
	// 	// mediaJuggle.createTimeChunk(mediaInfo, 2, 3, function (fileNameTimeChunk){
	// 	// 	console.log("fileName '%s' is chunked into: '%s'", fileName, fileNameTimeChunk);
	// 	// });

	// 	// var globalChunk = 4;
	// 	// // chunking file
	// 	// mediaJuggle.splitFile(mediaInfo, 3, function (newGlobalChunk){
	// 	// 	console.log("fileName '%s' is chunked into %d chunks", mediaInfo.fileName(), newGlobalChunk - globalChunk);
	// 	// });

	// });

	// var globalChunk = 10;
	// // chunking file list / folder
	// mediaJuggle.splitFolder(null, "mp3", globalChunk, function (newGlobalChunk){
	// 	console.log("folder '%s' is chunked into %d chunks", folderName, newGlobalChunk - globalChunk);
	// });

	mediaJuggle.init(folderName, listFileName)
	var listFilePath = mediaJuggle.mediaTransformation.getFullPath(listFileName);

	fs.readFile(listFilePath, 'utf8', function (err, dataStr) {
		if (err) {
			console.log(err);
		}else{
			// console.log('[kEdge::populateDemo]parsing file:\n' + dataStr);
			var listData = JSON.parse(dataStr);

			// mediaJuggle.init(folderName, listFileName).numberSetFolder(numberSetFolder).chunkLengthSec(60*7).indexAtTheStart(true)
			// 	.previousChunkSec(5);
			if(listData.previousChunk && listData.previousChunk.enable){
				mediaJuggle.previousChunkSec(listData.previousChunk.lengthSec);
				mediaJuggle.previousChunkIntegrateInLength(listData.previousChunk.integrateInLength);
			}
			if(listData.chunkFile){
				mediaJuggle.indexAtTheStart(!!listData.chunkFile.indexAtTheStart);
			}
			if(listData.chunkInfo){
				mediaJuggle.chunkLengthSec(listData.chunkInfo.lengthSec);
			}
			if(listData.numberSet && listData.numberSet.enable){
				mediaJuggle.numberSetFolder(listData.numberSet.folderName);
			}
			console.log("[loadDataFile] listData.mediaFiles.length: %s", listData.mediaFiles.length);
			var globalChunk = 1;
			mediaJuggle.splitFiles(listData.mediaFiles, globalChunk, function (newGlobalChunk){
				console.log("folder '%s' is chunked into %d chunks", folderName, newGlobalChunk - globalChunk);
			});
		}
	});
	break;
}


// ffmpeg -i data/Lolita\ audiobook\ Part\ 1\ Chapter\ 1.mp3