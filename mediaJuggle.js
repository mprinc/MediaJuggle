'use strict';

var path = require("path");
var fs = require('fs');
var sys = require('sys')

var MediaInfo = require("./mediaInfo");
var MediaTransformation = require("./mediaTransformation");

/**
 * This is the main class, the entry point to MediaJuggle. To use it, you just need to import mediaJungle:
 *
 * ```js
 * var MediaJuggle = require('mediaJungle');
 * ```
 *
 */
module.exports = (function() {

	var MediaJuggle = function(){
		this.folderPath = null;
		this.listFilePath = null;
		this._numberSetFolder = null;
		this._chunkLengthSec = 60*3;
		this._indexStrLength = 3;
		this._previousChunkSec = undefined;
		this._previousChunkIntegrateInLength = false;
		this._indexAtTheStart = false;
		this.mediaTransformation = new MediaTransformation();
	};

	MediaJuggle.prototype.init = function(folderName, listFileName){
		this.mediaTransformation.init(folderName);

		if(typeof listFileName != 'undefined'){
			this.listFilePath = this.mediaTransformation.getFullPath(listFileName);
			console.log("listFilePath: %s", this.listFilePath);
		}

		return this;
	};

	MediaJuggle.prototype.indexStrLength = function(indexStrLength){
		if(typeof indexStrLength == 'undefined'){
			return this._indexStrLength;
		}else{
			this._indexStrLength = indexStrLength;
			return this;			
		}
	};

	MediaJuggle.prototype.indexAtTheStart = function(indexAtTheStart){
		if(typeof indexAtTheStart == 'undefined'){
			return this._indexAtTheStart;
		}else{
			this._indexAtTheStart = indexAtTheStart;
			return this;			
		}
	};

	MediaJuggle.prototype.previousChunkSec = function(previousChunkSec){
		if(typeof previousChunkSec == 'undefined'){
			return this._previousChunkSec;
		}else{
			this._previousChunkSec = previousChunkSec;
			return this;			
		}
	};

	MediaJuggle.prototype.previousChunkIntegrateInLength = function(previousChunkIntegrateInLength){
		if(typeof previousChunkIntegrateInLength == 'undefined'){
			return this._previousChunkIntegrateInLength;
		}else{
			this._previousChunkIntegrateInLength = previousChunkIntegrateInLength;
			return this;			
		}
	};

	MediaJuggle.prototype.numberSetFolder = function(numberSetFolder){
		if(typeof numberSetFolder == 'undefined'){
			return this._numberSetFolder;
		}else{
			this._numberSetFolder = this.mediaTransformation.getFullPath(numberSetFolder);
			return this;			
		}
	};

	MediaJuggle.prototype.chunkLengthSec = function(chunkLengthSec){
		if(typeof chunkLengthSec == 'undefined'){
			return this._chunkLengthSec;
		}else{
			this._chunkLengthSec = chunkLengthSec;
			return this;			
		}
	};

	MediaJuggle.prototype.getIndexStr = function(index){
		var indexStr = "" + index;
		while(indexStr.length<this._indexStrLength) indexStr = "0"+indexStr;
		return indexStr;
	};

	MediaJuggle.prototype.getDigitFileName = function(digit){
		var numberSetFolder = path.resolve(__dirname + "/" + "data/sasha");
		var digitStr = this.getIndexStr(digit);
		console.log("[getDigitFileName] digitStr=%s", digitStr);
		var fileNameTime = this._numberSetFolder + "/" + digitStr + "-stereo.mp3";
		return fileNameTime;
	};

	MediaJuggle.prototype.getDigitFileNamesList = function(index){
		var digitFileNamesList = [];
		var multiplier = 1;
		var previousDigit = null;
		while(index>0){
			var digit = (index%10);
			var digitFileName;
			var multipliedDigit;
			if(multiplier == 10 && digit == 1){ // 10-19
				// i.e. replace 7 with 17
				digitFileNamesList.shift();
				multipliedDigit = 10+previousDigit;
				digitFileName = this.getDigitFileName(multipliedDigit);
			}else{
				multipliedDigit = multiplier*digit;
				digitFileName = this.getDigitFileName(multipliedDigit);
			}
			if(multipliedDigit != 0){
				digitFileNamesList.unshift(digitFileName);				
			}
			index = Math.floor(index/10);
			multiplier *= 10;
			previousDigit = digit;
		}
		return digitFileNamesList;
	};

	MediaJuggle.prototype.createTimeChunk = function(mediaInfo, globalIndex, localIndex, callback){
		console.log("---------------------------------------------\ncreateTimeChunk: globalIndex:%d, localIndex: %d", globalIndex, localIndex);
		var that = this;
		var indexStr = this.getIndexStr(globalIndex);
		var fileNameWithoutExtension = mediaInfo.getFileNameWithoutExtension();
		var fileNameChunk, fileNameTimeChunk;
		if(this._indexAtTheStart){
			fileNameChunk = indexStr+"-t" + " - " + fileNameWithoutExtension + "." + mediaInfo.fileExtension();
			fileNameTimeChunk = indexStr + " - " + fileNameWithoutExtension + "." + mediaInfo.fileExtension();
		}else{
			fileNameChunk = fileNameWithoutExtension + " - "+indexStr+"-t" + "." + mediaInfo.fileExtension();
			fileNameTimeChunk = fileNameWithoutExtension + " - "+indexStr + "." + mediaInfo.fileExtension();			
		}
		var concatenatingFileNamesList = this.getDigitFileNamesList(globalIndex);

		var startSec = localIndex*this._chunkLengthSec;
		if (typeof this._previousChunkSec != "undefined" && localIndex > 0){
			startSec -= this._previousChunkSec;
		}
		if(startSec>mediaInfo.lengthSec()){ // behind the start
			callback(fileNameTimeChunk, globalIndex, true);
			return;
		}

		var chunkLengthSec = this._chunkLengthSec;
		if(!this._previousChunkIntegrateInLength && typeof this._previousChunkSec != "undefined" && localIndex>0){
			chunkLengthSec += this._previousChunkSec;
		}
		if(startSec+chunkLengthSec>mediaInfo.lengthSec()){ // too short to provide the while chunk length
			chunkLengthSec = mediaInfo.lengthSec()-startSec;
		};

		concatenatingFileNamesList.push(this.mediaTransformation.getFullPathTemp(fileNameChunk));

		this.mediaTransformation.createMediaChunk(mediaInfo.filePath(), 
			this.mediaTransformation.getFullPathTemp(fileNameChunk), startSec, chunkLengthSec, function (){
			// console.log("fileName '%s' is chunked into '%s'", mediaInfo.fileName(), that.mediaTransformation.getFullPathTemp(fileNameChunk));
			that.mediaTransformation.concatenateMedia(concatenatingFileNamesList, 
			that.mediaTransformation.getFullPathOut(fileNameTimeChunk), function(){
				console.log("fileName '%s' is extended with time", mediaInfo.fileName());
				if(typeof callback == 'function'){
					callback(that.mediaTransformation.getFullPathOut(fileNameTimeChunk), globalIndex, false);
				}
			});
		});
	};

	MediaJuggle.prototype.splitFile = function(mediaInfo, globalIndex, callback){
		var that = this;
		var localIndex = 0;
		console.log("============================================\nsplitFile: globalIndex:%d, filename: %d", globalIndex, mediaInfo.fileName());
		var ckunkingFinished = function(fileNameTimeChunk, _globalIndex, wasNewCreated){
			// console.log("Chunked (gi: %d, li: %d) file '%s' is extended with time", _globalIndex, localIndex, fileNameTimeChunk);
			if(!wasNewCreated){
				localIndex++;
				_globalIndex++;
				that.createTimeChunk(mediaInfo, _globalIndex, localIndex, ckunkingFinished);
			}else{
				if(typeof callback == 'function'){
					callback(_globalIndex);
				}
			}
		};
		this.createTimeChunk(mediaInfo, globalIndex, localIndex, ckunkingFinished);
	};

	MediaJuggle.prototype.splitFiles = function(mediaFiles, globalIndex, callback){
		var that = this;
		console.log("===================================================================");
		console.log("[splitFiles] Splitting %d files: %s", mediaFiles.length, mediaFiles);
		console.log("===================================================================");
		if(mediaFiles.length <= 0){
			callback(globalIndex);
		}
		var mediaFileId = 0;
		var mediaInfoCallback = function(mediaInfo){
			var splitFileCallback = function(newGlobalIndex){
				globalIndex = newGlobalIndex;
				mediaFileId++;
				if(mediaFileId < mediaFiles.length){
					that.getMediaInfo(mediaFiles[mediaFileId], mediaInfoCallback);					
				}else{
					if(typeof callback == 'function'){
						callback(globalIndex);
					}
				}
			};

			that.splitFile(mediaInfo, globalIndex, splitFileCallback);
		}
		this.getMediaInfo(mediaFiles[mediaFileId], mediaInfoCallback);
	};

	MediaJuggle.prototype.splitFolder = function(mediaFolderName, extension, globalIndex, callback){
		var mediaFolderPath = mediaFolderName;
		if(!mediaFolderPath) mediaFolderPath = this.mediaTransformation.folderPath();

		extension = "." + extension;
		var files = fs.readdirSync(mediaFolderPath);

		var mediaFiles = [];
		for(var i in files) {
			if(path.extname(files[i]) === extension) mediaFiles.push(files[i]);
		}
		mediaFiles = mediaFiles.sort(function(a, b){
			return a.toLowerCase() > b.toLowerCase();
		});
		this.splitFiles(mediaFiles, globalIndex, callback);
	};

	MediaJuggle.prototype.reencodeFiles = function(folderNameIn, folderNameOut, mediaFiles, options, callback){
		var folderPathOut = folderNameOut;
		if(!folderPathOut) folderPathOut = this.mediaTransformation.folderPath();

		var that = this;
		console.log("===================================================================");
		console.log("[reencodeFiles] Reencoding %d files: %s", mediaFiles.length, mediaFiles);
		console.log("===================================================================");
		var mediaFileId = 0;
		if(mediaFiles.length <= 0){
			callback(folderNameOut);
		}
		var reencodeFileCallback = function(newGlobalIndex){
			mediaFileId++;
			if(mediaFileId < mediaFiles.length){
				var mediaFileIn = folderNameIn + "/" + mediaFiles[mediaFileId];
				var mediaFileOut  = folderPathOut + "/" + mediaFiles[mediaFileId];
				that.mediaTransformation.reencodeMedia(mediaFileIn, mediaFileOut, options, reencodeFileCallback);
			}else{
				if(typeof callback == 'function'){
					callback(folderNameOut);
				}
			}
		};

		var mediaFileIn = folderNameIn + "/" + mediaFiles[mediaFileId];
		var mediaFileOut  = folderPathOut + "/" + mediaFiles[mediaFileId];
		this.mediaTransformation.reencodeMedia(mediaFileIn, mediaFileOut, options, reencodeFileCallback);
	};

	MediaJuggle.prototype.reencodeFolder = function(folderNameIn, folderNameOut, extension, options, callback){
		var folderPathIn = folderNameIn;
		if(!folderPathIn) folderPathIn = this.mediaTransformation.folderPath();

		folderPathIn = this.mediaTransformation.getFullPath(folderPathIn);
		folderNameOut = this.mediaTransformation.getFullPath(folderNameOut);
		console.log("Reendcoding folder '%s' into '%s'", folderPathIn, folderNameOut);

		extension = "." + extension;
		var files = fs.readdirSync(folderPathIn);

		var mediaFiles = [];
		for(var i in files) {
			if(path.extname(files[i]) === extension) mediaFiles.push(files[i]);
		}
		this.reencodeFiles(folderNameIn, folderNameOut, mediaFiles, options, callback);
	};

	MediaJuggle.prototype.reencodeNumberSetFolder = function(callback){
	};

	MediaJuggle.prototype.getMediaInfo = function(fileName, callback){
		var mediaInfo = new MediaInfo();

		mediaInfo.fileName(fileName)
			.filePath(this.mediaTransformation.getFullPath(fileName))
			.fileExtension(fileName);

		this.mediaTransformation.getMediaLength(mediaInfo.filePath(), function(lengthSec){
			mediaInfo.lengthSec(lengthSec);
			if(typeof callback == 'function'){
				callback(mediaInfo);
			}
		});
	};

	return MediaJuggle;
})();