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
		"withNotExist": Boolean, // license 정보 없는 모듈의 정보 추출 여부
		"removeZero": Boolean,
		"compareVersion": Boolean, // 동일 모듈이 이미 있는 경우에 버전이 다르면 중복해서 넣을지 여부
		"help": Boolean
	},
	shortKey = {
		"n": ["--nDepth"],
		"o": ["--out"],
		"d": ["--description"],
		"f": ["--fileName"],
		"p": ["--path"],
		"fp": ["--filePath"],
		"w": ["--withNotExist"],
		"rz": ["--removeZero"],
		"cv": ["--compareVersion"],
		"h": ["--help"]
	};

let parsed = nopt(opts, shortKey, process.argv, 2),
	resultData = [],
	dupCheck = {},
	customPath = parsed.path || __dirname,
	{ nDepth, out, description, fileName, filePath, withNotExist, removeZero, compareVersion, help } = parsed

let getLicenseList = (paramPath) => {
	try {
		let files = fs.readdirSync(paramPath);

		let packageInfo = {};

		files.forEach(name => {
			log(`${paramPath}/${name}`)
			let isDirectory = fs.lstatSync(`${paramPath}/${name}`).isDirectory();

			// 폴더이고 -n 옵션 활성화시 해당 폴더 path로 재귀
			if (isDirectory && nDepth) {
				getLicenseList(`${paramPath}/${name}`);
			}

			if (name.toLowerCase() !== 'package.json' && name.toLowerCase() !== 'license') {
				return;
			}

			// package.json 확인
			if (name.toLowerCase() === 'package.json') {
				let packageJson = JSON.parse(fs.readFileSync(`${paramPath}/${name}`).toString());

				if (removeZero && (new String(packageJson.version).indexOf('0.0.0') > -1)) {
					return; // -rz 옵션인 경우 version이 0.0.0인 모듈은 제외	
				}

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
				packageInfo['licenseDescription'] = desc;
			}

			console.log(packageInfo);
			// package.json, license에 어떤 정보도 없는 경우
			if (Object.keys(packageInfo).length < 1) {
				console.log("여기 들어왔어");
				packageInfo['err'] = true;
				packageInfo['desc'] = 'package.json 및 license 파일이 없거나 필요 데이터가 없습니다.';
				packageInfo['filePath'] = `${paramPath}/${name}`;
			}
		})

		// license관련 정보가 있다면 중복 체크 후 삽입
		if (Object.keys(packageInfo).length > 0) {

			// 중복 체크 compareVersion
			if (dupCheck.hasOwnProperty(packageInfo.name)) {

				if (!compareVersion) return; // 중복시 버전체크 옵션(-cv)이 아니라면 무조건 중복 제외이므로 바로 리턴
				if (dupCheck[packageInfo.name] === packageInfo.version) return;
			}

			dupCheck[packageInfo.name] = packageInfo.version; // 중복 체크용 변수에 key-package name, value-package version으로 삽입
			resultData.push(packageInfo); // 중복이 아니라면 Result Data에 삽입
		}

	} catch (e) {
		console.log(e);
	}
}

let createFile = () => {
	console.log("\nStart File Create");
	let date = new Date(),
		todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

	let ws = fs.createWriteStream(fileName || `${todayDate}-license.txt`);

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

	ws.write(`Date: ${todayDate}`);

	// Error handling
	ws.on('error', err => {
		console.log(err);
		ws.end();
	})

	ws.end();
}

let showHelp = () => {
	console.log('======================================= option List =======================================');
	console.log('--help(-h) | show help');
	console.log('--nDepth(-n) | search up to sub-directory');
	console.log('--out(-o) | create license file');
	console.log('--description(-d) | Include a description of the "License" file in the generated file');
	console.log('--file(-f) | custom file name(generated file name)');
	console.log('--path(-p) | search path (if you do not enter, search current directory)');
	console.log('--filePath(-fp) | Whether the generated license file contains a module path');
	console.log('--withNotExist(-w) | Include module without information (module name is set "err")');
	console.log('--removeZero(-rz) | remove module with version 0.0.0');
	console.log('--compareVersion(-cv) | Duplicate modules included if version is different');
	console.log('===========================================================================================');
	process.exit(0);
}

(function init() {
	if (help) showHelp();
	console.log('start license search')
	getLicenseList(customPath);
	out && createFile();
	console.log("complete");
})();