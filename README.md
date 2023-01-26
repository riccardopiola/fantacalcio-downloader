# Fantacalcio downloader

This is a program to automatically download files from [fantacalcio.it](https://www.fantacalcio.it) and converts them from Excel (.xlsx) to JSON.

It offerts both a CLI interface and a Javascript API.

**NOTE**: This program was tested and was working as of 26/01/2023. It is possible that the fantacalcio.it API will change without notice thus breaking this program.

## CLI Usage

* Make sure you have a somewhat recent version of [NodeJS](https://nodejs.org/) installed on your system

* Clone the repository or download the zip file in a folder

* Run `npm install` from a terminal in the root directory to install all dependencies

* Run `node cli.js --help` to see the list of options

#### Modes

The program has 3 operating modes

1. Bulk download of excel files. Equivalent to going to a page like https://www.fantacalcio.it/voti-fantacalcio-serie-a/2022-23/18 and manually pressing "Scarica"

`node cli.js -u MYUSERNAME -s 2022-23 -f 18 --download_only`

This command will download a file named `"Voti_Fantacalcio_Stagione_2022-23_Giornata_18.xlsx"` and save it in `./tmp`

Alternatively you can omit the `-f|--fixture` parameter and download automatically ALL avalable fixtures for that season

**NOTE**: This mode requires you to have an account with fantacalcio.it as only registered users are allowed to download

2. Conversion of already-downloaded .xlxs files and conversion to JSON

Assuming you already downloaded the relevant Excel files and you just want to convert them to json run the following command

`node cli.js "C:\Users\Me\Downlads\Voti_Fantacalcio_Stagione_2022-23_Giornata_18.xlsx" ./some_other_file.xlsx`

This will convert the Excel files into JSON and save them by default in the `./out` folder (the output folder can be changed by passing an `--out` cli parameter)

3. Download and conversion

Same as mode 1 but without the `--download_only` command line switch. This will automatically download all files and convert them to JSON right after

#### All CLI Options

```
Positionals:
  xls_files  List xlsx files to convert (optional)

Options:
      --help             Show help                                     [boolean]
  -u, --user             Username for login
  -p, --pass             Password for login
  -s, --season           Tournament season (es. 2022-23)
  -f, --fixture          Fixture number [1-38]                          [number]
      --cache_dir        Folder for downloaded xlsx files       [default: "tmp"]
  -o, --out              JSON ouput folder                      [default: "out"]
      --debug            Print extra debug messages                    [boolean]
  -q, --quiet            Print only errors                             [boolean]
      --download_only    Download but skip JSON conversion             [boolean]
      --no_cookie_cache  Don't use the cookie cache                    [boolean]
      --log_file         Optional filename to output log messages
      --version          Show version number                           [boolean]
```

## Programmatic Usage

If you don't want to use the CLI you can also incorporate this project as a library into your application.

The is no npm package for now so you will have to add it like this

`npm install https://github.com/riccardopiola/fantacalcio-downloader`

To see the api exported look at `index.d.ts` which contains typescript typings and descriptions of the various exported methods

For example usage of those methods look at their usage in `cli.js` as they are quite straight forward