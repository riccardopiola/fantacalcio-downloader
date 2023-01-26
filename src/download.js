const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')

const { log, HTTPError } = require('./util')

class DownloadError extends HTTPError {
  constructor(url, res, season, fixture) {
    super(url, res, `Failed to download Excel worksheet for ${season} #${fixture}. Code ${res.status}. Msg: ${res.statusText}`)
    this.season = season
    this.fixture = fixture
  }
}

// Node doesn't terminate properly with keep-alive on
const commonHeaders = {
  // "Connection": "keep-alive",
  // "Keep-Alive": "timeout=10, max=20000"
}

async function login(username, password) {
  const url = "https://www.fantacalcio.it/api/v1/User/login"
  const res = await fetch(url, {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" }, commonHeaders),
    body: JSON.stringify({ username, password })
  })
  const { status, statusText } = res
  if (!res.ok)
    throw new HTTPError(url, res)
  const body = await res.json()
  if (!body.success)
    throw new HTTPError(url, res, `Invalid login credentials`, body)
  if (!res.headers.has("set-cookie"))
    throw new HTTPError(url, res, `Failed to retreive login cookies`, body)
  log.info(`Logged in as ${body.username}`)
  return res.headers.get('set-cookie')
}

const encodeName = (season, fixture) => (
  `Voti_Fantacalcio_Stagione_${season}_Giornata_${fixture}.xlsx`
)

const decodeName = (filename) => {
  const regex = /Voti_Fantacalcio_Stagione_(\d{4}-\d{2})_Giornata_(\d+)/
  const results = filename.match(regex)
  if (!results)
    throw new Error(`Cannot extract season and fixture from filename "${filename}"`)
  return [ results[1], Number.parseInt(results[2], 10) ]
}

function downloadWithCache(season, fixture, cookie, cache_dir) {
  const fileName = path.join(cache_dir, encodeName(season, fixture))
  return new Promise((res, rej) => {
    if (fs.existsSync(fileName)) {
      // If the file is already present on disk
      log.info(`${season} #${fixture} already present. Using cache`)
      res(fileName)
    } else {
      // Otherwise download it
      downloadVotes(season, fixture, cookie, fileName)
        .then(() => res(fileName))
        .catch(rej)
    }
  })
}

// In fantacalcio.it seasons are represented by integers starting from 10
const _yearToSeasonIdMap = {
  "2015-16": "10",
  "2016-17": "11",
  "2017-18": "12",
  "2018-19": "13",
  "2019-20": "14",
  "2020-21": "15",
  "2021-22": "16",
  "2022-23": "17"
}

async function downloadVotes(season, fixture, cookie, outFile) {
  const seasonId = _yearToSeasonIdMap[season]
  if (!seasonId) throw new Error(`Invalid season provided. Expected one of ${_yearToSeasonIdMap.join(' ')} but instead got ${season}`)
  const url = `https://www.fantacalcio.it/api/v1/Excel/votes/${seasonId}/${fixture}`
  log.info(`Trying to download ${season} #${fixture}...`)
  log.debug("Download url:  " + url)
  log.debug("Download path: " + outFile)
  const res = await fetch(url, {
    headers: Object.assign({ cookie }, commonHeaders)
  })
  if (!res.ok)
    throw new DownloadError(url, res, season, fixture)
  log.debug(`HTTP ${res.code} for ${url}`)
  const fileStream = fs.createWriteStream(outFile)
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream)
    res.body.on('error', reject)
    fileStream.on('finish', () => {
      log.info(`Finished downloading ${season} #${fixture}`)
      resolve()
    })
  })
}

module.exports = {
  login,
  downloadVotes,
  downloadWithCache,
  encodeName,
  decodeName,
  DownloadError,
}