const fs = require('fs'),
	path = require('path'),
	nopt = require('nopt'),
	opts = {
		"nDepth": Boolean,
		"path": path,
		"out": Boolean,
		"description": Boolean,
		"fileName": String
	},
	shortKey = {
		"n": ["--nDepth"],
		"o": ["--out"],
		"d": ["--description"],
		"f": ["--fileName"]
	};

let parsed = nopt(opts, shortKey, process.argv, 2);
let customPath = parsed.path || __dirname,
	fileName = parsed.filename || "";

if (parsed.out) {
	fs.createWriteStream(`./${fileName}`);
}
fs.readdir(customPath, (err, folders) => {
	folders.forEach(name => {
		let isDirectory = fs.lstatSync(`${customPath}/${name}`).isDirectory();


	})

	// 파일인지 폴더인지 구별
	// package.json 인지 구별
	// license 파일인지 구별

})