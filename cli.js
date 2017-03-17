#! /usr/bin/env node
// /usr/local/bin/node

const fs = require('fs')
const path = require('path')
const program = require('commander')
const mkdirp = require('mkdirp')
const request = require('request')
const ora = require('ora')
const rimraf = require('rimraf')
const execFile = require('child_process').execFile

const baseurl = 'https://api.unsplash.com/'
const homedir = require('os').homedir()
const un = {
  applicationId: '1789f35b2543c6a52fc3ec3d34cc148c044abca7e104b424f27cd4f6a360c0a3',
  secret: 'c36a930244826a51e47d0be974d5514731f49964bfc61e062235df20334058b1',
  callbackUrl: 'urn:ietf:wg:oauth:2.0:oob'
}

const dl = (uri, filename, callback) => {
  request.head(uri, (err, res, body) => {
    if (err) throw (new Error(err))
    const extt = res.headers['content-type'].split('/').pop()
    request(uri).pipe(fs.createWriteStream(filename + extt)).on('close', () => callback(filename + extt))
  })
}
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'))
const basedir = homedir + '/.wallkey'

mkdirp(basedir)
const basefile = `${basedir}/${Date.now() * 1000}.`

program
  .version(pkg.version)
  .option('-c, --clear', 'clear dir')
  .option('-q, --query <n>', 'search on unsplash')
  .option('-u, --url <n>', 'use the img from url')
  .parse(process.argv)

if (program.clear) {
  const spinner = ora('Deleting pictures...').start()
  rimraf(basedir, {},
    (err) => {
      if (err) throw (new Error(err))
      spinner.succeed('Cleaned.')
    })
} else if (program.url) {
  const spinner = ora('Downloading picture...').start()
  dl(program.url, basefile, (file) => setWall(file, spinner))
} else {
  const spinner = ora('Downloading picture...').start()
  const query = program.query ? program.query : ''
  const opt = {
    method: 'GET',
    url: `${baseurl}photos/random`,
    qs: { query },
    headers: {
      'Accept-Version': 'v1',
      'Authorization': 'Client-ID ' + un.applicationId
    },
    json: true
  }
  request(opt, (err, res, body) => {
    try {
      if (err) throw (new Error(err))
      return dl(body.urls.full, basefile, (file) => setWall(file, spinner))
    } catch (e) { spinner.fail(e) }
  })
}

function setWall (filename, spinner) {
  execFile(
    './wallkey-cmd',
    [filename],
    (error, stdout, stderr) => {
      if (error) {
        spinner.fail(error)
        throw error
      }
      spinner.succeed('Wallpaper changed.')
    }
  )
}
