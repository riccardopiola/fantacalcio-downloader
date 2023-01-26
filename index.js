
const { parseXlsxFile } = require('./src/convert')
const { login, encodeName, decodeName, downloadVotes, downloadWithCache, DownloadError } = require('./src/download')
const { log, Log, LogLevel, HTTPError } = require('./src/util')

module.exports = {
  parseXlsxFile,
  login,
  downloadVotes,
  downloadWithCache,
  encodeName,
  decodeName,
  DownloadError,
  HTTPError,
  log,
  Log,
  LogLevel
}