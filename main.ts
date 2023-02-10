import { traverseNode } from '@create-figma-plugin/utilities'

export function truncateLastCharacters() {
  truncateFunction(truncateLastCharactersFunction)
}

export function truncateLastWords() {
  truncateFunction(truncateLastWordsFunction)
}

export function truncateLastSpaces() {
  truncateFunction(truncateLastSpacesFunction)
}

export function truncateFirstCharacters() {
  truncateFunction(truncateFirstCharactersFunction)
}

export function truncateFirstWords() {
  truncateFunction(truncateFirstWordsFunction)
}

export function truncateFirstSpaces() {
  truncateFunction(truncateFirstSpacesFunction)
}

export function truncateMiddleCharacters() {
  truncateFunction(truncateMiddleCharactersFunction)
}

export function truncateMiddleWords() {
  truncateFunction(truncateMiddleWordsFunction)
}

export function truncateMiddleSpaces() {
  truncateFunction(truncateMiddleSpacesFunction)
}

function truncateFunction(truncateCommand: Function) {
  let options = ['16', '24', '32', '48', '56', '64']
  if (
    [
      truncateLastWordsFunction.name,
      truncateFirstWordsFunction.name,
      truncateMiddleWordsFunction.name,
    ].includes(truncateCommand.name)
  ) {
    options = ['4', '8', '12', '16', '20', '24']
  }
  figma.parameters.on(
    'input',
    ({ key, query, result }: ParameterInputEvent) => {
      switch (key) {
        case 'keepLength':
          setSuggestionsForNumberInput(query, result, options)
          break
        case 'ellipsis':
          result.setSuggestions(['…'])
          break
        default:
          break
      }
    }
  )
  figma.on('run', ({ parameters }: RunEvent) => {
    if (typeof parameters === 'undefined') {
      throw new Error('`runEvent.parameters` is `undefined`')
    }
    if (typeof parameters.ellipsis === 'undefined') {
      parameters.ellipsis = '…'
    }
    truncateText(truncateCommand, parameters.keepLength, parameters.ellipsis)
  })
}

async function truncateText(
  truncateCommand: Function,
  keepLength: number,
  ellipsis: string
) {
  var nodes = getSelectedTextNodes()
  if (nodes.length == 0) {
    figma.closePlugin(`⚠️   Please select text nodes first.`)
  }
  var pending = nodes.length
  await Promise.all(
    nodes.map((textNode: TextNode) => {
      figma.loadFontAsync(textNode.fontName as FontName).then(() => {
        textNode.characters = truncateCommand(
          textNode.characters,
          keepLength,
          ellipsis
        )
        pending--
        if (pending == 0) {
          figma.closePlugin(`✅   ${nodes.length} text nodes converted.`)
        }
      })
    })
  )
}
function getSelectedTextNodes(): Array<TextNode> {
  const nodes = figma.currentPage.selection
  const result: Array<TextNode> = []
  for (const node of nodes) {
    traverseNode(node, function (childNode: SceneNode) {
      if (childNode.type !== 'TEXT') {
        return
      }
      result.push(childNode)
    })
  }
  return result
}

// Check that the input is a valid number
function setSuggestionsForNumberInput(
  query: string,
  result: SuggestionResults,
  completions?: string[]
) {
  if (query === '') {
    result.setSuggestions(completions ?? [])
  } else if (!Number.isFinite(Number(query))) {
    result.setError('Please enter a numeric value')
  } else if (Number(query) <= 0) {
    result.setError('Must be larger than 0')
  } else {
    const filteredCompletions = completions
      ? completions.filter(s => s.includes(query) && s !== query)
      : []
    result.setSuggestions([query, ...filteredCompletions])
  }
}

// COMMAND FUNCTIONS

function truncateLastCharactersFunction(
  text: string,
  length: number,
  suffix: string
) {
  if (text.length < length) {
    return text
  } else {
    let str = text.substring(0, length - suffix.length).trimEnd()
    return `${removePunctationAtEnd(str)}${suffix}`
  }
}

function truncateLastWordsFunction(
  text: string,
  length: number,
  suffix: string
) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let str = words.splice(0, length).join(' ')
    return `${removePunctationAtEnd(str)}${suffix}`
  }
}

function truncateLastSpacesFunction(
  text: string,
  length: number,
  suffix: string
) {
  let str
  switch (true) {
    case text.length < length:
      return text
    case text.split(' ')[0].length >= length - suffix.length:
      str = text.split(' ')[0]
      break
    default:
      str = text.substring(
        0,
        text.substring(0, length - suffix.length).lastIndexOf(' ')
      )
      break
  }
  return `${removePunctationAtEnd(str)}${suffix}`
}

function truncateFirstCharactersFunction(
  text: string,
  length: number,
  suffix: string
) {
  if (text.length < length) {
    return text
  } else {
    let str = text.substring(text.length - length + suffix.length).trimStart()
    return `${suffix}${removePunctationAtStart(str)}`
  }
}

function truncateFirstWordsFunction(
  text: string,
  length: number,
  suffix: string
) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let str = words.splice(words.length - length).join(' ')
    return `${suffix}${removePunctationAtStart(str)}`
  }
}

function truncateFirstSpacesFunction(
  text: string,
  length: number,
  suffix: string
) {
  let str
  switch (true) {
    case text.length < length:
      return text
    case text.substring(text.lastIndexOf(' ')).length >= length - suffix.length:
      str = text.substring(text.lastIndexOf(' '))
      break
    default:
      str = text
        .substring(text.length - length + suffix.length)
        .substring(
          text.substring(text.length - length + suffix.length).indexOf(' ')
        )
      break
  }
  return `${suffix}${removePunctationAtStart(str.trimStart())}`
}

function truncateMiddleCharactersFunction(
  text: string,
  length: number,
  suffix: string
) {
  if (text.length < length) {
    return text
  } else {
    let start = text
      .substring(0, Math.ceil((length - suffix.length) / 2))
      .trimEnd()
    let end = text
      .substring(text.length - Math.floor((length - suffix.length) / 2))
      .trimStart()
    return `${removePunctationAtEnd(start)}${suffix}${removePunctationAtStart(
      end
    )}`
  }
}

function truncateMiddleWordsFunction(
  text: string,
  length: number,
  suffix: string
) {
  let words = text.split(' ')
  if (words.length <= length) {
    return text
  } else {
    let start = words.splice(0, Math.ceil(length / 2)).join(' ')
    let end = words.splice(words.length - Math.floor(length / 2)).join(' ')
    return `${removePunctationAtEnd(start)} ${suffix} ${removePunctationAtStart(
      end
    )}`
  }
}

function truncateMiddleSpacesFunction(
  text: string,
  length: number,
  suffix: string
) {
  let start, end
  if (text.length < length || text.split(' ').length < 3) {
    return text
  }
  if (text.split(' ')[0].length >= Math.ceil((length - suffix.length) / 2)) {
    start = text.split(' ')[0]
  } else {
    start = text.substring(
      0,
      text
        .substring(0, Math.ceil((length - suffix.length) / 2))
        .lastIndexOf(' ')
    )
  }
  if (
    text.substring(text.lastIndexOf(' ')).length >=
    Math.floor((length - suffix.length) / 2)
  ) {
    end = text.substring(text.lastIndexOf(' ')).trimStart()
  } else {
    end = text
      .substring(text.length - Math.floor((length - suffix.length) / 2))
      .substring(
        text
          .substring(text.length - Math.floor((length - suffix.length) / 2))
          .indexOf(' ')
      )
      .trimStart()
  }
  return `${removePunctationAtEnd(start)} ${suffix} ${removePunctationAtStart(
    end
  )}`
}

// REMOVE PUNCTATIONS

function removePunctationAtEnd(str: string) {
  return str.replace(/[.,/#!$%^&*;:{}=\-_`~()]$/g, '')
}

function removePunctationAtStart(str: string) {
  return str.replace(/^[.,/#!$%^&*;:{}=\-_`~()]/g, '')
}
