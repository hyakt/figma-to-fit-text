import figma from 'figma-js'
import dotenv from 'dotenv'
import fs from 'fs'

const {
  PERSONAL_ACCESS_TOKEN,
  FILE_ID,
  NODE_ID,
  FITTEXT_PREFIX_ID
} = dotenv.config().parsed

const client = figma.Client({
  personalAccessToken: PERSONAL_ACCESS_TOKEN
})

const file = await client.fileNodes(FILE_ID, { ids: [NODE_ID] })
const document = file.data.nodes[NODE_ID].document

const documentX = document.absoluteBoundingBox.x
const documentY = document.absoluteBoundingBox.y

const textDocument = document.children.find((c) => c.name === 'Text')

const vAlign = (textAlignVertical) => {
  if (textAlignVertical === 'TOP') return 'top'
  if (textAlignVertical === 'CENTER') return 'middle'
  if (textAlignVertical === 'BOTTOM') return 'bottom'
  return 'top'
}

const hAlign = (textAlignHorizontal) =>
  textAlignHorizontal?.toLowerCase() || 'left'

const hasChildren = (c) => Boolean(c.children)

const textDocumentFunction = (c) => {
  if (hasChildren(c)) {
    return {
      name: c.name,
      value: c.children.map(textDocumentFunction)
    }
  }

  const { fontSize, textAlignHorizontal, textAlignVertical } = c.style || {}
  const { x, y, width, height } = c.absoluteBoundingBox
  const relativeX = Math.abs(documentX - x)
  const relativeY = Math.abs(documentY - y)
  const value = `<FitText id='${FITTEXT_PREFIX_ID || ''}${
    c.name
  }' x={${relativeX}} y={${relativeY}} width={${width}} height={${height}} fontSize={${
    fontSize || '14'
  }} vAlign='${vAlign(textAlignVertical)}' hAlign='${hAlign(
    textAlignHorizontal
  )}'>${c.name}</FitText>`

  return {
    name: c.name,
    value
  }
}

const result = textDocument.children.map(textDocumentFunction)

let text = ''
const resultFunction = (c) => {
  text += `${c.name}:`
  text += '\n'
  if (Array.isArray(c.value)) {
    c.value.forEach(resultFunction)
    text += '\n'
  } else {
    text += c.value
    text += '\n'
  }
}

result.forEach(resultFunction)

try {
  if (!fs.existsSync('./target')) {
    fs.mkdirSync('./target')
  }
  fs.writeFileSync('./target/result.txt', text)
  fs.writeFileSync('./target/result.json', JSON.stringify(result, null, 2))
} catch (e) {
  console.error(e.message)
}

console.log('Done')
console.log('Check ./target/result.txt')
