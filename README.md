# getLicenseList
## 패키지내 라이센스 정보 가져오기

## Options
| Option | Short key | Description |
|help | h |  show help
|nDepth | n |  search up to sub-directory
|out | o |  create license file
|description | d |  Include a description of the "License" file in the generated file
|file | f |  custom file name(generated file name)
|path | p |  search path (if you do not enter, search current directory)
|filePath | fp |  Whether the generated license file contains a module path
|removeZero | rz |  remove module with version 0.0.0
|compareVersion | cv |  Duplicate modules included if version is different

## Examples
<code>
node .\index.js -n -o -f "licenseList.txt"
</code>  
