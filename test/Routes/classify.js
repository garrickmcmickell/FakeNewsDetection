const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English')
const mongoUrl = "mongodb://localhost:27017/" 

module.exports = (req, res) => {
  console.log('Classify API hit')
  classifyDocument(req.body, function(err, result) {
    if (err) {
      res.send(err)
    }
    else {
      res.send(result)
    }
  })
}

function classifyDocument(document, callback) {
  saveAsPlain(document, callback)
  savePhraseChunks(document, callback)
}

function saveAsPlain(document, callback) {
  MongoClient.connect(mongoUrl, function(err, db) {
    if(err) callback(err, null)
    const dbo = db.db('classifiedArticles')
    const coll = dbo.collection('articlePlain')
    coll.insertOne(document, function(err, res) {
      if(err) callback(err, null)
      else callback(null, 'Document inserted')
      db.close()
    })
  })
}

async function savePhraseChunks(document, callback) {
  const forest = await getForest(document)
  const chunks = []
  phraseChainChunker(forest, chunks)
  const doc = {title: document.title, phraseChunks: chunks, classifier: document.classifier}
  
  MongoClient.connect(mongoUrl, async function(err, db) {
    if(err) throw err
    const dbo = db.db('classifiedArticles')
    const coll = dbo.collection('articlePhraseChunked')
    coll.insertOne(doc, function(err, res) {
      if(err) callback(err, null)
      else callback(null, 'Document inserted')
      db.close()
    })
  })
}

//Post-order depth-first search. Passes array of branch strings upwards,
//starting at the leaf. Nodes construct strings by using current node and
//appening all sub-tree branches in passed array, adding them to beginning
//of the array, popping the sub-tree branch off of the array, pushing itself
//on to array, and passing the array up to the parent for use in same process.
//Result is an array of strings of all contained combinations of phrase chunks
//for the given tree. 
function phraseChainChunker(node, phraseChains = []) {
  var arr = []    

  node.children.forEach(child => {
    phraseChainChunker(child, phraseChains).forEach(value => arr.push(value))
  })

  arr.forEach(value => {
    arr.unshift('[' + node.pos + arr[arr.length - 1] + ']'), arr.pop()
  })

  arr.push('[' + node.pos + ']')
  arr.forEach(phraseChain => phraseChains.push(phraseChain))
  return arr
}

async function getForest(document) {
  const forest = {pos: 'DOC', children: []}
  for(let i = 0; i < document.lines.length; i++) {
    const grove = await getGrove(document.lines[i])
    forest.children.push(grove)
  }
  return forest
}

function getGrove(line) {
  return new Promise((resolve, reject) => {
    const paragraph = new CoreNLP.default.simple.Document(line)
    let grove = {pos: 'PARA', children: []}
    pipeline.annotate(paragraph)
    .then(doc => {
      for(let i = 0; i <doc.sentences().length; i ++) {
        const thicket = fromString(doc.sentence(i).parse())
        thicket.children.forEach(tree => {
          grove.children.push(tree)
        })      
      }
      resolve(grove)                 
    })
  })
}

function fromString(str) {
  let currentNode = { children: [], parent: {} }
  const openNodes = [currentNode]
  
  for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') {
        currentNode = { str: '', children: [] }
        openNodes[openNodes.length - 1].children.push(currentNode)
        openNodes.push(currentNode)
      } 
      else if (str[i] === ')') {
        scrubNode(currentNode)
        openNodes.pop()
        currentNode = openNodes[openNodes.length - 1]
      } 
      else {
        currentNode.str += str[i]
      }
    }
  return currentNode.children[0]
}

function scrubNode(node) {
  const str = node.str.trim()
  const delimiterPos = str.indexOf(' ')
  if (delimiterPos > -1) {
    node.pos = str.substr(0, delimiterPos)
    node.word = str.substr(delimiterPos + 1)
  } else {
    node.pos = str;
  }
  delete node.str
}