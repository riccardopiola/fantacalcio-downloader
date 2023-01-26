
/**
 * Error class that represents an error during
 * an HTTP request
 */
export declare class HTTPError extends Error {
  url: string
  status: number
  statusText: string
  headers: any
  body?: any
}

/**
 * Error class for errors during download of an excel spreadsheet
 */
export declare class DownloadError extends HTTPError {
  season: string
  fixture: number
}

/**
 * Logs in the user using username/password
 * Note: Throws an HTTPError with message "Invalid login credentials"
 * if the username/password combination is invalid
 * @returns The authentication cookie
 */
export function login(username: string, password: string): string

/**
 * Downloads an excel file corresponding to {season} and {fixture} and
 * saves it in {outfile}
 * @param season The season (e.g. "2022-23" )
 * @param fixture A number between 1 and 38
 * @param cookie Authentication cookie obtainable via login() (or the browser)
 * @param outFile Where to save the downloaded content
 */
export function downloadVotes(
  season: string,
  fixture: number,
  cookie: string,
  outFile: string
): Promise<void>

/**
 * Same as downloadVotes but caches the result in the folder specified by {cache_dir}
 * Likewise it first checks if the {cache_dir} already has a file with the
 * name it is looking for and if so uses that instead of making a request
 * @returns A promise that resolves to the path to the searched file on disk
 */
export function downloadWithCache(
  season: string,
  fixture: number,
  cookie: string,
  cache_dir: stirng
): Promise<string>

/**
 * Creates a file name consistent with fantacalcio.it naming convention
 * from a {season} string (e.g. "2022-23") and a {fixture} number (e.g. 18)
 * encodeName("2022-23", 18) => "Voti_Fantacalcio_Stagione_2022-23_Giornata_18.xlsx"
 */
export function encodeName(
  season: string,
  fixture: number
): string

/**
 * Inverse of encodeName(). Extracts season and fixture from a canonical
 * filaname of the type "Voti_Fantacalcio_Stagione_2022-23_Giornata_18.xlsx"
 * @returns A tuple containing [ season, fixture ]
 */
export function decodeName(filename: string): [ season: string, fixture: number ]

enum PlayerRole {
  Portiere        = "P",
  Difensore       = "D",
  Centrocampista  = "C",
  Attaccante      = "A",
  Allenatore      = "ATT"
}

// Represents a player and stats about his performance in a particular fixture
export interface Player {
  id: number    // Unique id given to the player by fantacalcio.it
  role: PlayerRole
  name: string  // Name of the player
  vote: number  // (decimal) Player vote
  gf: number    // Goal fatti
  gs: number    // Goal subiti
  rp: number    // Rigori parati?
  rs: number    // Rigori subiti
  rf: number    // Rigori fatti
  au: number    // Autogoal
  amm: number   // Ammonizioni
  esp: number   // Espulsioni
  ass: number   // Assist
}

export interface Team {
  name: string,     // Team name
  players: Player[]
}

/**
 * Parses the provided excel file and returns its object representation
 * @param filename Path to .xlsx file as downloaded from official site or this library
 * @returns The data grouped by Team
 */
export function parseXlsxFile(filename: string): Team[]

// Logging functions used in the library
// You can replace them with yout own
// The "extra" parameter can be ignored
export const log: {
  error:  (msg: string, extra?: any) => void
  warn:   (msg: string, extra?: any) => void
  info:   (msg: string, extra?: any) => void
  debug:  (msg: string, extra?: any) => void
}

// LogLevel constants (mainly used to set Log._logLevel)
export const LogLevel: {
  ERROR:  number,
  WARN:   number,
  INFO:   number,
  DEBUG:  number
}

export const Log: {
  // fs.createWriteStream (if present will be used for logging)
  _logStream: any,
  // Minimum log level (by default it is LogLevel.INFO)
  _logLevel: number,
  // Enables file logging to the specified logFile
  enableFileLog(logFile: string): void
  // Common log function called by log.error  log.warn etc...
  // severity is one the LogLevel constants
  logCommon(severity: number, msg: string, extra?: any): void
}
