const fs = require('fs')
const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

//const train =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal.txt', 'utf8'))
//const train2 =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal2.txt', 'utf8'))
//const train3 = new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesReal.txt', 'utf8') + fs.readFileSync('./sampleSentencesReal2.txt', 'utf8'))
//const test =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesFake.txt', 'utf8'))
//const test2 =  new CoreNLP.default.simple.Document(fs.readFileSync('./sampleSentencesFake2.txt', 'utf8'))
const text = new CoreNLP.default.simple.Document("This is my sample sentence, which is short.")

pipeline.annotate(/*train2*/)
  .then(doc => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err
      const dbo = db.db("jsAppTest")    
      
      for(let i = 0; i < doc.sentences().length; i++) {
        let arr = []
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)

        getPositions(tree.rootNode, arr)
        
        arr.forEach(element => {
          dbo.collection(/*"train2"*/).insertOne( element , function(err, res) {
            if (err) throw err;
            console.log("1 document inserted")
          })
        })        
      }
      db.close()      
    })
  })
  .catch(err => {
    console.log('err', err)
  })

  function getPositions(node, arr = [], index = {row: 0, rows: [{x: 0, y: 0}]}) {  
    if(index['rows'].length <= index['row']) 
      index['rows'].push({x: index['row'], y: index['rows'][index['row'] - 1]['y']})

    arr.push({pos: node.pos(), x: index['row'], y: index['rows'][index['row']]['y']})

    index['row']++
    node.children().forEach(child => {
      index = getPositions(child, arr, index)
      index['rows'][index['row']]['y'] += 1
    })

    index['row']--

    return index
  }


