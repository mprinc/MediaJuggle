'use strict';

var path = require("path");
var fs = require('fs');

var sys = require('sys')
var exec = require('child_process').exec;

/**
 * This is the main class, the entry point to MediaTransformation. To use it, you just need to import mediaTransformation:
 *
 * ```js
 * var MediaTransformation = require('mediaTransformation');
 * ```
 *
 */
module.exports = (function() {

	var MediaTransformation = function(){
		this._folderPath = null;
		this.numberSetFolder = null;
		this.tempFolderPath = null;
		this.outFolderPath = null;
	};

	MediaTransformation.prototype.init = function(folderName){
		this.folderPath(folderName);

		this.tempFolderPath = path.resolve(this._folderPath + "/" + "tmp");
		console.log("tempFolderPath: %s", this.tempFolderPath);
		try {
		    // Query the entry
		    var stats = fs.lstatSync(this.tempFolderPath);

		    // Is it a directory?
		    if (!stats.isDirectory()) {
		    	console.error("temp destination is not folder");
		    }
		}
		catch (e) {
			console.error("missing temp folder, creating a new one (error: %s)", e);
			fs.mkdirSync(this.tempFolderPath, parseInt('0755',8));
		}

		this.outFolderPath = path.resolve(this._folderPath + "/" + "out");
		console.log("outFolderPath: %s", this.outFolderPath);
		try {
		    // Query the entry
		    var stats = fs.lstatSync(this.outFolderPath);

		    // Is it a directory?
		    if (!stats.isDirectory()) {
		    	console.error("out destination is not folder");
		    }
		}
		catch (e) {
			console.error("missing out folder, creating a new one (error: %s)", e);
			fs.mkdirSync(this.outFolderPath, parseInt('0755',8));
		}	
	};

	MediaTransformation.prototype.folderPath = function(_folderPath){
		if(typeof _folderPath == 'undefined'){
			return this._folderPath;
		}else{
			if(_folderPath && _folderPath.length>0 && _folderPath[0] == "/"){
				this._folderPath = _folderPath;
			}else{
				this._folderPath = path.resolve(__dirname + "/" + _folderPath);
			}
			console.log("folderPath: %s", this._folderPath);

			return this;			
		}
	};

	// Get full path name (in the default data folder) for the provided fileName
	MediaTransformation.prototype.getFullPath = function(fileName){
		// filename is already provided with full path
		if(fileName && fileName.length>0 && fileName[0] == "/"){
			return fileName;
		}else{
			return this._folderPath + "/" + fileName;
		}
	};

	// Get full path name (in the out folder) for the provided fileName
	MediaTransformation.prototype.getFullPathOut = function(fileName){
		// filename is already provided with full path
		if(fileName && fileName.length>0 && fileName[0] == "/"){
			return fileName;
		}else{
			return this.outFolderPath + "/" + fileName;
		}
	};

	// Get full path name (in the temp folder) for the provided fileName
	MediaTransformation.prototype.getFullPathTemp = function(fileName){
		// filename is already provided with full path
		if(fileName && fileName.length>0 && fileName[0] == "/"){
			return fileName;
		}else{
			return this.tempFolderPath + "/" + fileName;
		}
	};

	MediaTransformation.prototype.concatenateMedia = function(fileNamesIn, fileNameOut, callback){
		// example
		// ffmpeg -i "concat:01.mp3|test.mp3" -acodec copy joint.mp3

		var fullNamesIn = [];
		for(var i=0; i<fileNamesIn.length; i++){
			fullNamesIn[i] = this.getFullPath(fileNamesIn[i]);
		}
		var fullNamesInStr = fullNamesIn.join("|");
		var fullNameOut = this.getFullPath(fileNameOut);

		console.log("concatenating %d files: '%s' to '%s'", fullNamesIn.length, fullNamesInStr, fullNameOut);

		var cmd = "ffmpeg -y -i \"concat:" + fullNamesInStr + "\" -acodec copy '" + fullNameOut + "'";
		// console.log("executing command: %s", cmd);
		var concatenateCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log("executing command: %s", cmd);
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			callback(null);
		};

		var child = exec(cmd, concatenateCallback.bind(this));
	};

	MediaTransformation.prototype.createMediaChunk = function(fileNameIn, fileNameOut, startSec, lengthSec, callback){
		// example
		// ffmpeg -i input-file.mp3 -acodec copy -t 00:00:25 -ss 00:00:35 output-file.mp3

		var fullNameIn = this.getFullPath(fileNameIn);
		var fullNameOut = this.getFullPathOut(fileNameOut);
		console.log("chunking file '%s' to '%s'", fullNameIn, fullNameOut);

		var startTime = this.convertSecToTime(startSec);
		var lengthTime = this.convertSecToTime(lengthSec);

		var cmd = "ffmpeg -y -i '" + fullNameIn + "' -acodec copy -t " + lengthTime + " -ss " + startTime + " '" + fullNameOut + "'";
		// console.log("executing command: %s", cmd);
		var chunkedCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log("executing command: %s", cmd);
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			if(typeof callback == 'function'){
				callback(null);
			}
		};

		var child = exec(cmd, chunkedCallback.bind(this));
	};

	// ffmpeg -i data/dr-zivago/sasha/001-stereo.mp3 -f mp3  -ab 64k -ar 24000 -ac 2 data/dr-zivago/sasha/001-stereo-f.mp3
	MediaTransformation.prototype.reencodeMedia = function(fileNameIn, fileNameOut, options, callback){
		var fullNameIn = this.getFullPath(fileNameIn);
		var fullNameOut = this.getFullPathOut(fileNameOut);
		console.log("Reencoding file '%s' to '%s'", fullNameIn, fullNameOut);

		if(!("acodec" in options)) options.acodec = "copy";
		var paramsStr = "";
		if("f" in options) paramsStr += "-f " + options.f + " ";
		if("ab" in options) paramsStr += "-ab " + options.ab + " ";
		if("ar" in options) paramsStr += "-ar " + options.ar + " ";
		if("ac" in options) paramsStr += "-ac " + options.ac + " ";
		if("acodec" in options) paramsStr += "-acodec " + options.acodec + " ";

		var cmd = "ffmpeg -y -i '" + fullNameIn + "' " + paramsStr + " '" + fullNameOut + "'";
		// console.log("executing command: %s", cmd);
		var reencodedCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log("executing command: %s", cmd);
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			callback(fullNameOut);
		};

		var child = exec(cmd, reencodedCallback.bind(this));
	};

	// http://wiki.multimedia.cx/index.php?title=FFmpeg_Metadata
	// http://jonhall.info/how_to/create_id3_tags_using_ffmpeg
	// ffmpeg -i '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/Lolita audiobook Part 1 Chapter 1 - 005.mp3' -acodec copy -metadata title="Lolita - cunk 5" -metadata year="2015" '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/Lolita audiobook Part 1 Chapter 1 - 005t.mp3'
	// ffmpeg -i '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/Lolita audiobook Part 1 Chapter 1 - 005.mp3' -f ffmetadata '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/metadata.txt'
	MediaTransformation.prototype.convertTimeToSec = function(lengthTime){
		var lengthSec = 0;
		var i1 = 0, i2 = 0;
		do{
			i2 = lengthTime.indexOf(":", i1);
			var timePart = lengthTime.substring(i1, (i2>0 ? i2 : undefined));
			lengthSec = lengthSec*60 + parseFloat(timePart);
			// console.log("Length: %s => %s", timePart, lengthSec);
			i1 = i2+1;
		}while(i2>0);

		lengthSec = Math.round(lengthSec*1000) / 1000;
		return lengthSec;
	};

	MediaTransformation.prototype.convertSecToTime = function(lengthSec){
		var lengthTime = "";

		var count = 0;

		do{
			var timePart = lengthSec - Math.floor(lengthSec / 60) * 60;
			timePart = Math.round(timePart * 1000) / 1000;
			// console.log("Length: %s", timePart);
			lengthTime = (timePart < 10 ? "0" : "") + timePart + (lengthTime.length > 0 ? ":" : "") + lengthTime;
			lengthSec = Math.floor(lengthSec/60);
			// console.log("lengthSec: %s", lengthSec);
			count++;
		}while(lengthSec > 0);

		while(count<3){ // extend to hours
			lengthTime = "00:" + lengthTime;
			count++;
		}
		// do{
		// 	i2 = lengthTime.indexOf(":", i1);
		// 	var timePart = lengthTime.substring(i1, (i2>0 ? i2 : undefined));
		// 	lengthSec = lengthSec*60 + parseFloat(timePart);
		// 	console.log("Length: %s => %s", timePart, lengthSec);
		// 	i1 = i2+1;
		// }while(i2>0);

		// lengthSec = Math.round(lengthSec*1000) / 1000;
		return lengthTime;
	};

	// TODO: obsolated with getMediaParams
	MediaTransformation.prototype.getMediaLength = function(fileName, callback){
		var fullName = this.getFullPath(fileName);
		console.log("checking file length: '%s'", fullName);

		// http://www.dzone.com/snippets/execute-unix-command-nodejs
		// https://nodejs.org/api/child_process.html
		// https://www.npmjs.com/package/shelljs
		var lengthCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			var result = stdout || stderr;
			var lengthStr = result.match( /duration: ([\d\:\.]+)/i );
			// console.log("Length: %s", lengthStr);
			if(!lengthStr || lengthStr.length<2){
				callback(null);
				return;
			}
			var lengthSec = this.convertTimeToSec(lengthStr[1]);
			console.log("Length: %s sec", lengthSec);
			var lengthTime = this.convertSecToTime(lengthSec);
			console.log("Length: %s", lengthTime);
			callback(lengthSec);
		};

		// executes `ffprobe <filename>`
		var cmd = "ffprobe '" + fullName + "'";
		console.log("executing command: %s", cmd);
		var child = exec(cmd, lengthCallback.bind(this));
	};

	MediaTransformation.prototype.getMediaParams = function(fileName, callback){
		var fullName = this.getFullPath(fileName);
		console.log("Retrieving file params: '%s'", fullName);

		// http://www.dzone.com/snippets/execute-unix-command-nodejs
		// https://nodejs.org/api/child_process.html
		// https://www.npmjs.com/package/shelljs
		var paramsCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			var result = stdout || stderr;

			/***********************************
			info (length, ...)
			************************************/
			var info = null;
			var lengthStr = result.match( /duration: ([\d\:\.]+)/i );
			// console.log("Length: %s", lengthStr);
			if(lengthStr && lengthStr.length==1+1){
				var lengthSec = this.convertTimeToSec(lengthStr[1]);
				// console.log("Length: %s sec", lengthSec);
				var lengthTime = this.convertSecToTime(lengthSec);
				// console.log("Length: %s", lengthTime);

				info = {
					length: lengthSec
				};
			}
			/***********************************
			format
			************************************/
			var format = null;
			var streamParamsArray = result.match( /stream.*audio: (.*)/i );
			// console.log("Length: %s", lengthStr);
			if(streamParamsArray && streamParamsArray.length==1+1){
				var streamParamsSeparateStr = streamParamsArray[1];
				// console.log("streamParams: %s", streamParamsSeparateStr);
				var streamParamsSeparateArray = streamParamsSeparateStr.match( /([^\,]+)\, ([\d]+) hz\, ([^\,]+), ([^\,]+)\, ([\d]+ k?)b\/s/i );
				if(streamParamsSeparateArray && streamParamsSeparateArray.length==5+1){
					var ac = 1;
					if (streamParamsSeparateArray[3].match( /(stereo)/i).length == 2) ac = 2;
					var ab = streamParamsSeparateArray[5];
					var result = ab.match( /(\d+) (\S)/i);
					if (result.length == 3) ab = result[1] + result[2];
					format = {
						f: streamParamsSeparateArray[1],
						ar: streamParamsSeparateArray[2],
						ac: ac,
						sf: streamParamsSeparateArray[4],
						ab: ab
					};

					// console.log("format: %s", JSON.stringify(format));
				}
			}

			var parms = {
				info: info,
				format: format
			};

			// console.log("parms: %s", JSON.stringify(parms));
			callback(parms);
		};

		// executes `ffprobe <filename>`
		var cmd = "ffprobe '" + fullName + "'";
		console.log("executing command: %s", cmd);
		var child = exec(cmd, paramsCallback.bind(this));
	};

	MediaTransformation.prototype.getMediaMetadata = function(fileName, callback){
		var fullName = this.getFullPath(fileName);
		console.log("Retrieving file params: '%s'", fullName);

		// http://www.dzone.com/snippets/execute-unix-command-nodejs
		// https://nodejs.org/api/child_process.html
		// https://www.npmjs.com/package/shelljs
		var paramsCallback = function (error, stdout, stderr) {
			// sys.print('stdout: ' + stdout);
			// sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.error('exec error: ' + error);
				callback(null);
				return;
			}

			var result = stdout || stderr;

			/***********************************
			Metadata (length, ...)
			************************************/
			var lengthStr = result.match( /duration: ([\d\:\.]+)/i );
			// console.log("Length: %s", lengthStr);
			if(lengthStr && lengthStr.length==1+1){
				var lengthSec = this.convertTimeToSec(lengthStr[1]);
				console.log("Length: %s sec", lengthSec);
				var lengthTime = this.convertSecToTime(lengthSec);
				console.log("Length: %s", lengthTime);

				var meta = {
				};
			}

			// callback(lengthSec);
		};

		// ffmpeg -i '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/Lolita audiobook Part 1 Chapter 1 - 005.mp3' -f ffmetadata '/Users/sasha/Documents/data/development/mediaJuggle/data/lolita-eng/out/metadata.txt'
		// executes `ffprobe <filename>`
		var cmd = "ffprobe '" + fullName + "'";
		console.log("executing command: %s", cmd);
		var child = exec(cmd, paramsCallback.bind(this));
	};
	return MediaTransformation;
})();