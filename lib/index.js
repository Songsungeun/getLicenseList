const fs = require('fs'),
	path = require('path'),
	log = require('single-line-log').stdout,
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
		"w": ["--withNotExist"]
	};

let parsed = nopt(opts, shortKey, process.argv, 2),
	customPath = parsed.path || __dirname,
	resultData = [],
	{ nDepth, out, description, fileName, filePath, withNotExist } = parsed;

let getLicenseList = async (paramPath) => {
	try {
		let files = fs.readdirSync(paramPath);

		let packageInfo = {};

		files.forEach(name => {
			log(`${paramPath}/${name}`)
			let isDirectory = fs.lstatSync(`${paramPath}/${name}`).isDirectory();
			if (isDirectory && nDepth) {
				getLicenseList(`${paramPath}/${name}`);
			}

			if (name.toLowerCase() !== 'package.json' && name.toLowerCase() !== 'license') {
				return;
			}

			if (name.toLowerCase() === 'package.json') {
				let packageJson = JSON.parse(fs.readFileSync(`${paramPath}/${name}`).toString());

				if (packageJson.hasOwnProperty('name')) {
					packageInfo['name'] = packageJson.name || '';
					packageInfo['version'] = packageJson.version || '';
					packageInfo['repository'] = packageJson.repository || '';
					packageInfo['license'] = packageJson.license || '';

					if (filePath) packageInfo['filePath'] = `${paramPath}/${name}`;
				}
			}

			// license 파일 읽어올 경우 (-d option)
			if (description && name.toLowerCase() === 'license') {
				let desc = fs.readFileSync(`${paramPath}/${name}`).toString();
				console.log(desc);
				packageInfo['licenseDescription'] = desc;
			}

			if (Object.keys(packageInfo).length < 1) {
				packageInfo['err'] = true;
				packageInfo['desc'] = 'package.json 및 license 파일이 없거나 필요 데이터가 없습니다.';
				packageInfo['filePath'] = `${paramPath}/${name}`;
			}
		})

		if (Object.keys(packageInfo).length > 0) {
			resultData.push(packageInfo); // result에 모듈이름과 정보 키-밸류로 insert
		}

	} catch (e) {
		console.log(e);
	}
}

let createFile = () => {
	console.log("\nStart File Create")

	let ws = fs.createWriteStream(fileName || "licenseInfo.txt");

	let write = (license, index) => {
		let desc = ''; // 1. license info 제일 하단에 넣기 위한 별도 저장용 변수
		log(`${index}/${resultData.length}`)
		Object.keys(license).forEach((key) => {
			//repository: {"type":"git","url":"https://github.com/Songsungeun/TripMap"} 형식인 경우
			if (license[key] instanceof Object) {
				license[key] = license[key]['url'] || license[key];
			}

			if (key === 'licenseDescription') { // => 1
				desc = license[key];
				return;
			}

			ws.write(`${key}: ${license[key]}\n`);
		})
		desc && ws.write(`license Info: ${license['licenseDescription']}`) //license info는 제일 하단에 넣음
		ws.write('\n\n')
	}

	// license 없는 모듈 추출 여부
	if (withNotExist) {
		resultData.forEach((license, index) => {
			write(license, index);
		})
	} else {
		resultData.filter((license) => { return !license.hasOwnProperty('err') })
			.forEach((license, index) => { write(license, index) });
	}

	// Error handling
	ws.on('error', err => {
		console.log(err);
		ws.end();
	})

	ws.end();
}


(function init() {
	console.log('start license search')
	getLicenseList(customPath);
	out && createFile();
	console.log("complete");
})();