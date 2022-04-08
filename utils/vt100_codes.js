const colorArr = {
  "black"    : 30,
  "red"      : 31, 
  "green"    : 32,
  "yellow"   : 33,
  "blue"     : 34,
  "magenta"  : 35,
  "cyan"     : 36,
  "white"    : 37
}

export function colorize(color, text) {
  return `\x1b[${colorArr[color]}m${text}\x1b[0m`
}

export function bold(text) {
  return `\x1b[1m${text}\x1b[0m`
}