'use strict';

/**
 * This is the MediaInfo class it holds info of the media file (type, length)
 *
 * ```js
 * var MediaInfo = require('mediaInfo');
 * ```
 *
 */
module.exports = (function() {

	var MediaInfo = function(){
		this._fileName = null;
		this._filePath = null;
		this._mediaType = null;
		this._fileExtension = null;
		this._lengthSec = null;
	};

	MediaInfo.prototype.fileName = function(fileName){
		if(typeof fileName == 'undefined'){
			return this._fileName;
		}else{
			this._fileName = fileName;
			return this;			
		}
	};

	MediaInfo.prototype.filePath = function(filePath){
		if(typeof filePath == 'undefined'){
			return this._filePath;
		}else{
			this._filePath = filePath;
			return this;			
		}
	};

	MediaInfo.prototype.mediaType = function(mediaType){
		if(typeof mediaType == 'undefined'){
			return this._mediaType;
		}else{
			this._mediaType = mediaType;
			return this;			
		}
	};

	// returns/sets file extension
	// for setting if it finds "." in the fileExtension it will assume it is provided with both filename and extension
	// and it will try to extract the extension part
	MediaInfo.prototype.fileExtension = function(fileExtension){
		if(typeof fileExtension == 'undefined'){
			return this._fileExtension;
		}else{
			this._fileExtension = fileExtension;
			if(this._fileExtension && this._fileExtension.length>0 && this._fileExtension.lastIndexOf(".") >=0){
				// if there are zero characters after the last "."
				if(this._fileExtension.lastIndexOf(".")+1 >= this._fileExtension.length){
					this._fileExtension = null;
				}else{
					this._fileExtension = this._fileExtension.substring(this._fileExtension.lastIndexOf(".")+1);					
				}
			}
			return this;			
		}
	};

	MediaInfo.prototype.getFileNameWithoutExtension = function(){
		var fileNameWithoutExtension = this._fileName;
		if(this._fileName && this._fileName.length>0 && this._fileName.lastIndexOf(".") >=0){
			fileNameWithoutExtension = this._fileName.substring(0, this._fileName.lastIndexOf("."));					
		}
		return fileNameWithoutExtension;
	};

	MediaInfo.prototype.lengthSec = function(lengthSec){
		if(typeof lengthSec == 'undefined'){
			return this._lengthSec;
		}else{
			this._lengthSec = lengthSec;
			return this;			
		}
	};

	return MediaInfo;
})();