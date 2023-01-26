const readExcel = require('read-excel-file/node')
const assert = require('assert')
const fs = require('fs')

const { log, fatalError } = require('./util')

async function parseXlsxFile(filename) {
  log.debug(`Starting to parse xlsx file: ${filename}`)
  const rows = await readExcel(filename)
  log.debug(`Converting ${rows.length} rows from ${filename}...`)
  return parseXlsxRows(rows)
}

function parseXlsxRows(rows) {
  // Rows [0;3] are useless
  // assert(rows[0][0] === "Voti Fantacalcio 18ª giornata di campionato")

  let i = 4 // First team starts at index 4
  const teams = []
  while(i < rows.length) {
    const team = {
      name: rows[i++][0],
      players: []
    }
    // If we don't have a team name means the excel worksheet is over
    if (typeof team.name !== 'string')
      break
    // Skip the table head row
    if (rows[i++][0] !== "Cod.") {
      fatalError(`Unexpected formatting for row ${i}`, rows[i - 1])
    }
    // Parse the table body (player rows)
    while(i < rows.length) {
      const player = rows[i]
      // If row doesn't start with a number code it's not a player
      if (typeof player[0] !== 'number')
        break;
      i++;
      team.players.push({
        id:   player[0],
        role: player[1],
        name: player[2],
        vote: player[3],
        gf:   player[4],
        gs:   player[5],
        rp:   player[6],
        rf:   player[7],
        au:   player[8],
        amm:  player[9],
        esp:  player[10],
        ass:  player[11],
      })
    }
    log.debug(`Finished parsing team ${team.name}. Found ${team.players.length} players`)
    teams.push(team)
  }
  return teams;
}

module.exports = {
  parseXlsxFile,
  parseXlsxRows
}