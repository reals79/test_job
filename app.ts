import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import glob from 'glob'

if (process.argv.length < 3) {
  console.log('The argument is missing.')
  process.exit(1)
}

const readFile = promisify(fs.readFile)
const pathArg: string = process.argv[2]

const filePattern: string = 'in.*.dat'
const folderPath: string = path.join(__dirname, pathArg)
const filesMask: string = path.join(folderPath, filePattern)

interface DataFile {
  fileName: string
  resCalc: number
}

console.log('Scanning folder: ', folderPath)
glob(filesMask, (err, files) => {
  if (err) {
    return console.error('Unable to scan directory: ' + err)
  }
  if (files.length > 0) {
    Promise.all(
      files.map(async (file) => {
        return readFile(file)
          .then((data) => {
            let result: number = 0
            const lines: string[] = data.toString().replace(/\r\n/g, '\n').split('\n')
            const mathAction: string = lines[0]
            const inNum: number = +file.split('.')[1]
            const dataNum: number[] = lines[1].split(' ').map(Number)
            dataNum.forEach((val) => {
              result += eval(inNum.toString() + mathAction + val.toString())
            })
            const resFile: DataFile = {
              fileName: file,
              resCalc: result,
            }
            return resFile
          })
          .catch((err) => {
            console.error('Unable to read file: ' + err)
          })
      })
    )
      .then((results) => {
        const outFile: string = path.join(folderPath, 'out.dat')
        let outContent: string = ''
        if (results) {
          let summa: number = 0
          results.map((result) => {
            const res: DataFile = result as DataFile
            summa += res.resCalc
            outContent += res.fileName + ': ' + res.resCalc.toString() + '\r\n'
          })
          outContent += '\r\n'
          outContent += '∑: ' + summa.toString() + '\r\n'
          outContent += 'µ: ' + (summa / results.length).toFixed(2).toString() + '\r\n'
          fs.writeFile(outFile, outContent, (err) => {
            if (err) {
              console.error('Unable to write file: ' + err)
            }
            console.log('Done!')
          })
        }
      })
      .catch((err) => {
        return console.error(err)
      })
  } else {
    return console.info('Nothing!')
  }
})
