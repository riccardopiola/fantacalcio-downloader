const chalk = require('chalk')
const fs = require('fs')

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

const _logForFile = [
  "[ERROR] ",
  "[WARNING] ",
  "[INFO] ",
  "[DEBUG] "
]

const _logForConsole = [
  chalk.red("error"),
  chalk.yellowBright("warn"),
  chalk.cyan("info"),
  chalk.gray("debug")
]

var Log = {
  _logStream: undefined, // fs.createWriteStream
  _logLevel: LogLevel.INFO,
  enableFileLog(logFile) {
    this.logStream = fs.createWriteStream(logFile)
    this.enableFileLog = true
  },
  logCommon(severity, msg, extra) {
    if (severity > this._logLevel) return;
    if (this._logStream) {
      this._logStream.write(_logForFile[severity])
      this._logStream.write(msg)
      if (extra)
        this._logStream.write(extra.toString())
    }
    if (extra)
      console.log(`${_logForConsole[severity]}: ${msg}`, extra)
    else
      console.log(`${_logForConsole[severity]}: ${msg}`)

  },
}

const log = {
  error: Log.logCommon.bind(Log, LogLevel.ERROR),
  warn:  Log.logCommon.bind(Log, LogLevel.WARN),
  info:  Log.logCommon.bind(Log, LogLevel.INFO),
  debug: Log.logCommon.bind(Log, LogLevel.DEBUG),
}

function fatalError(msg, extra) {
  log.error(msg, extra)
  process.exit(1)
}

const assertOrFatal = (condition, msg, extra) => (!condition)? fatalError(msg, extra) : undefined

function prettyPrintTeams(teams) {
  console.log(chalk.green(team.name))
  team.players.forEach(player => {
    console.log(`  ${player.role.padEnd(3)} ${player.name.padEnd(25)} ${player.vote}`)
  })
  console.log("")
}

class HTTPError extends Error {
  constructor(url, res, msg, body) {
    super(msg ??
      `Request to ${url} failed with code ${res.code} and status ${res.statusText}`
    )
    this.url = url
    this.status = res.status
    this.statusText = res.statusText
    this.headers = res.headers
    if (body)
      this.body = body
  }
}

module.exports = {
  fatalError,
  assertOrFatal,
  prettyPrintTeams,
  Log,
  LogLevel,
  log,
  HTTPError
}