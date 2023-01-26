const yargs = require('yargs')
const readline = require('readline-sync')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const { parseXlsxFile } = require('./src/convert')
const { login, downloadVotes, downloadWithCache, DownloadError } = require('./src/download')
const { fatalError, log, Log, LogLevel, HTTPError, assertOrFatal } = require('./src/util')

const args = yargs(process.argv.slice(2))
  // Download options
  .option("user", {
    alias: "u",
    description: "Username for login"
  })
  .option("pass", {
    alias: "p",
    description: "Password for login"
  })
  .option("season", {
    alias: "s",
    description: "Tournament season (es. 2022-23)",
    help: "Tournament season (es. 2022-23)",
  })
  .option("fixture", {
    alias: "f",
    type: "number",
    description: "Fixture number [1-38]",
    help: "Fixture number (giornata) [1-38] to download. If not specified downloads the entire season"
  })
  // Folders
  .option("cache_dir", {
    default: "tmp",
    description: "Folder for downloaded xlsx files",
    help: "Name of the folder in which to put downloaded files (relative to cwd)"
  })
  .option("out", {
    alias: "o",
    default: "out",
    description: "JSON ouput folder",
    help: "Name of the folder where JSON files will be put (relative to cwd)"
  })
  // Convert
  .positional("xls_files", {
    array: true,
    description: "List xlsx files to convert (optional)",
    help: "List of .xlsx files to convert to json. Leave empty and specify download options if you want to use the download feature"
  })
  // Extra
  .option("debug", {
    type: "boolean",
    description: "Print extra debug messages"
  })
  .option("quiet", {
    alias: "q",
    type: "boolean",
    description: "Print only errors"
  })
  .option("download_only", {
    type: "boolean",
    description: "Download but skip JSON conversion"
  })
  .option("no_cookie_cache", {
    type: 'boolean',
    description: "Don't use the cookie cache"
  })
  .option("log_file", {
    description: "Optional filename to output log messages"
  })
  .example('$0 "C:\\Users\\Me\\Downloads\\Downloaded File.xlsx" ./some_file.xlsx ', "Converts the two excel files to json")
  .example('$0 -u myusername -s 2022-23 -f 18', "Downloads and converts all games from 18th fixture for the 2022-23 season")
  .example('$0 -u myusername -s 2015-16 --download-only', "Downloads ALL the games from 2015-16 season (without converting to json)")
  .version()
  .parseSync()

/**
 * Tries to log in the user using the username from command line
 * and password.
 * Password is prompted if not present in command line arguments
 * If the coookie is present in a file named cookie.txt that will
 * be used instead
 * @returns The authentication cookie
 */
async function getCookie() {
  // Check if we already have a cookie file saved
  if (!args.no_cookie_cache && fs.existsSync('cookie.txt')) {
    log.info("Using saved cookie in file ./cookie.txt")
    return fs.readFileSync('cookie.txt')
  }
  // Make sure we have a username/pass
  assertOrFatal(args.user, "You need to provide a username to initiate a download. Alternatively you can grab the cookie from the browser and paste it into a file named cookie.txt in the root directory")
  let password = args.pass
  if (!password) {
    log.debug("No password spcified in command line: prompting the user...")
    password = readline.question(`Password for username ${args.user}: `, {
      hideEchoBack: true, // Hide password with "*"
    })
    if (!password)
      fatalError("Invalid password")
  }

  // Perform login request
  log.debug(`Starting login sequence for user ${args.user}`)
  try {
    var cookie = await login(args.user, password)
  } catch (err) {
    if (err instanceof HTTPError && !args.debug &&
        err.message === "Invalid login credentials")
        fatalError("Invalid username/password combination")
    else
      throw err
  }

  // Check and save the cookie
  if (!cookie)
    fatalError("Failed to retreive authentication cookie")
  log.debug(`User authentication completed successfully`)
  // Save the cookie for later use
  if (!args.no_cookie_cache) {
    fs.writeFileSync('cookie.txt', cookie)
    log.debug("Saved cookie to " + path.resolve(__dirname, 'cookie.txt'))
  }
  return cookie
}

/**
 * Dowloads one or more fixtures according to command line arguments
 */
async function download() {
  // Login or read auth cookie from file
  const cookie = await getCookie()

  // Check we have enough arguments
  assertOrFatal(args.season, "You need to provide at least a season argument to download")
  log.debug(`Requesting votes for season ${args.season}`)

  // List all the fixtures we're interested in
  const fixtures = []
  if (args.fixture) {
    log.debug(`Fixture argument provided (${args.fixture}). Starting download`)
    fixtures.push(args.fixture)
  } else {
    log.debug(`No fixture argument provided. Downloading all fixtures of season ${args.season}`)
    for (let i = 1; i <= 38; i++)
      fixtures.push(i)
  }

  // Queue all downloads
  const xlsFiles = []
  const fixturesNotFound = [];
  for (let fixture of fixtures) {
    const cache_dir = path.resolve(__dirname, args.cache_dir)
    try {
      const xlsFile = await downloadWithCache(args.season, fixture, cookie, cache_dir)
      xlsFiles.push(xlsFile)
    } catch (err) {
      // console.log("Caught Err", err)
      // process.exit(1)
      if (err instanceof DownloadError && fixtures.length !== 1)
        fixturesNotFound.push(err.fixture)
      else
        throw err
      if (fixturesNotFound.length > 3 /* max failures */)
        break;
    }
  }

  if (fixturesNotFound.length > 0)
    log.warn(`Failed to find fixtures ${fixturesNotFound.sort().join(' ')}`)
  log.info("All downloads completed")
  return xlsFiles
}

/**
 * Converts one or more .xlsx files to json
 */
async function convert(xlsFiles) {
  // Setup output folder
  let outDir = path.resolve(__dirname, args.out)
  log.debug("Output folder is " + outDir)
  if (!fs.existsSync(outDir)) {
    log.debug("Output folder is not present. Creating...")
    fs.mkdirSync(outDir)
  }

  for (let file of xlsFiles) {
    // Parse excel file
    log.debug("Starting parse of file: " + file)
    const teams = await parseXlsxFile(file)
    log.debug("Successfully parsed " + file)

    // Write results
    const newFileName = path.basename(file.slice(0, -5)) + ".json"
    fs.writeFile(path.join(outDir, newFileName), JSON.stringify(teams), (err) => {
      if (err)
        throw err
      log.info("Finished writing " + newFileName)
    })
  }
}

// Setup logging
if (args.debug)
  Log._logLevel = LogLevel.DEBUG
else if (args.quiet)
  Log._logLevel = LogLevel.ERROR
if (args.log_file) {
  log.debug("Logs will be saved to file " + args.log_file)
  Log.enableFileLog(args.log_file)
}

// Perform download and/or conversion
if (args.xls_files && args.xls_files.length > 0) {
  if (args.season)
    log.warn(`Specified both a season (${args.season}) and excel files to convert. Downloading will be skipped`)
  convert(args.xls_files.map(file => {
    const absFile = path.resolve(__dirname, file)
    const exists = fs.existsSync(absFile)
    log.debug(`Checking file exists: [${exists}] ${absFile}`)
    assertOrFatal(exists, `File ${file} does not exist`)
    return absFile
  }))
} else if (args.season) {
  download()
    .then(xlsFiles => {
      if (args.download_only)
        return log.info("--download_only has been provided. Stopping now")
      return convert(xlsFiles)
    })
} else {
  fatalError("You need to provide an input. For usage run with --help")
}

