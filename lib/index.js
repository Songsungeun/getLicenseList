const fs = require('fs'),
	path = require('path'),
	treeify = require('treeify'),
	nopt = require('nopt'),
	opts = {
		"nDepth": Boolean,
		"path": path,
		"out": Boolean,
		"description": Boolean,
		"fileName": String,
		"filePath": String,
		"withNotExist": Boolean // license 정보 없는 모듈의 정보 추출 여부
	},
	shortKey = {
		"n": ["--nDepth"],
		"o": ["--out"],
		"d": ["--description"],
		"f": ["--fileName"],
		"p": ["--path"],
		"fp": ["--filePath"],
		"wN": ["--withNotExist"]
	};

let parsed = nopt(opts, shortKey, process.argv, 2),
	customPath = parsed.path || __dirname,
	resultData = [],
	{ nDepth, out, description, fileName, filePath, withNotExist } = parsed;

fs.readdir(customPath, (err, folders) => {
	folders.forEach(name => {
		// let isDirectory = fs.lstatSync(`${customPath}/${name}`).isDirectory();
		let packageInfo = {};
		if (name.toLowerCase() === 'package.json') {
			// let read = fs.createReadStream(`${customPath}/name`);
			let packageJson = JSON.parse(fs.readFileSync(`${customPath}/${name}`).toString());

			if (packageJson.hasOwnProperty('name')) {
				packageInfo['name'] = packageJson.name || '';
				packageInfo['version'] = packageJson.version || '';
				packageInfo['repository'] = packageJson.repository || '';
				packageInfo['license'] = packageJson.license || '';

				if (filePath) packageInfo['filePath'] = `${customPath}/${name}`
			}
		}

		// license 파일 읽어올 경우 (-d option)
		// Todo
		if (description && name.toLowerCase().includes('license')) {
			let desc = fs.readFileSync(`${customPath}/${name}`).toString();
			packageInfo['licenseDescription'] = desc;
		}

		if (Object.keys(packageInfo).length < 1) {
			packageInfo['err'] = true;
			packageInfo['desc'] = 'package.json 및 license 파일이 없거나 필요 데이터가 없습니다.'
			packageInfo['filePath'] = `${customPath}/${name}`
		}

		resultData.push(packageInfo); // result에 모듈이름과 정보 키-밸류로 insert
	})

	// 파일인지 폴더인지 구별
	// package.json 인지 구별
	// license 파일인지 구별

	if (out) {
		// fs.writeFile('test.txt', JSON.stringify(resultData, null, "\t"), (err) => {
		// 	if (err) throw err;
		// 	console.log('Complete')
		// })

		let ws = fs.createWriteStream("test2.txt");

		resultData.forEach((license) => {
			Object.keys(license).forEach((key) => {
				ws.write(`${key}: ${license[key]}\n`);
			})
			ws.write('\n\n')
		})
		ws.end();

	}
})

