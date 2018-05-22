const fs = require('fs')
const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const train =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal.txt', 'utf8'))
const train2 =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal2.txt', 'utf8'))
const train3 = new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal.txt', 'utf8') + fs.readFileSync('./sampleSentencesReal2.txt', 'utf8'))
const test =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesFake.txt', 'utf8'))
const test2 =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesFake2.txt', 'utf8'))
const test3 = new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesFake.txt', 'utf8') + fs.readFileSync('./sampleSentencesFake2.txt', 'utf8'))
//const text = new CoreNLP.default.simple.Document("This is my sample sentence, which is short.")

const data = {
  train: train,
  train2: train2,
  train3: train3,
  test: test,
  test2: test2,
  test3: test3
}

Object.keys(data).forEach(key => {
  pipeline.annotate(data[key]/*data[key]*/)
  .then(doc => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err
      const dbo = db.db("phraseChunk"/*"jsAppTest"*/)    
      
      for(let i = 0; i < doc.sentences().length; i++) {
        let arr = []
        let obj = {}
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)

        phraseChainChunker(tree.rootNode, arr)
        phraseChunkerLite(tree.rootNode, obj)
        
        
        //arr.forEach(element => {
          dbo.collection(key/*key*/).insertOne( { phraseChunks: arr } , function(err, res) {
            if (err) throw err;
            console.log("1 document inserted")
          })
        //})        
      }
      db.close()      
    })
  })
  .catch(err => {
    console.log('err', err)
  })
})
  
  //Post-order depth-first search. Passes array of branch strings upwards,
  //starting at the leaf. Nodes construct strings by using current node and
  //appening all sub-tree branches in passed array, adding them to beginning
  //of the array, popping the sub-tree branch off of the array, pushing itself
  //on to array, and passing the array up to the parent for use in same process.
  //Result is an array of strings of all contained combinations of phrase chunks
  //for the given tree. 
  function phraseChainChunker(node, phraseChains = []) {
    var arr = []    
  
    node.children().forEach(child => {
      phraseChainChunker(child, phraseChains).forEach(value => arr.push(value))
    })

    arr.forEach(value => {
      arr.unshift('[' + node.pos() + arr[arr.length - 1] + ']'), arr.pop()
    })

    arr.push('[' + node.pos() + ']')
    arr.forEach(phraseChain => phraseChains.push(phraseChain))
    return arr
  }

  //Counts node parts-of-speech and parent-child parts of speech, which
  //are saved by key in an object.
  function phraseChunkerLite(node, obj = {}) {
    obj['[' + node.pos() + ']'] = 
        '[' + node.pos() + ']' in obj ? 
        obj['[' + node.pos() + ']'] + 1 : 1;

    node.children().forEach(child => {
      obj['[' + node.pos() + '][' + child.pos() + ']'] = 
          '[' + node.pos() + '][' + child.pos() + ']' in obj ?
          obj['[' + node.pos() + '][' + child.pos() + ']'] + 1 : 1;
      
      phraseChunkerLite(child, obj);
    });
  }

  //See ParseStructure doc.
  function getGridPositionsSpread(node, arr = [], index = {row: 0, rows: [{x: 0, y: 0}]}) {  
    if(index['rows'].length <= index['row']) 
      index['rows'].push({x: index['row'], y: index['rows'][index['row'] - 1]['y']})

    arr.push({pos: node.pos(), x: index['row'], y: index['rows'][index['row']]['y']})

    index['row']++
    node.children().forEach(child => {
      index = getGridPositionsSpread(child, arr, index)
      index['rows'][index['row']]['y'] += 1
    })

    index['row']--
    return index
  }

  //See ParseStructure doc.
  function getGridPositionsFlat(node, arr = [], row = 0) {
    if(row == 0) arr.push({ pos: node.pos(), x: 0, y: 0 })

    node.children().forEach((child, index) => {
      arr.push({ pos: child.pos(), x: row + 1, y: index })
      row = getGridPositionsFlat(child, arr, ++row)
    })
    
    return --row
  }