const fs = require('fs')
const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const text = fs.readFileSync('./sampleSentences.txt', 'utf8')

const doc =  new CoreNLP.default.simple.Document(text)

pipeline.annotate(doc)
  .then(doc => {
    /*for(let i = 0; i < doc.sentences().length; i++) {
      const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)
      //console.log(doc.sentences(i).parse())
      var mat =  AdjacencyMatrix.convertTreeToMatrix(tree);
      const rows = {id: [], pos: [], parent: []}
      generateRows(tree.rootNode, rows)
      console.log('doc.sentences(i).parse()')*/
    
    MongoClient.connect(url, function(err, db) {
      if (err) throw err
      const dbo = db.db("jsAppTest")    
      
      for(let i = 0; i < doc.sentences().length; i++) {
        let rows = { id: [], pos: [], parent: [] }
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)

        generateRows(tree.rootNode, rows)
        
        dbo.collection("fakeRows").insertOne( rows , function(err, res) {
          if (err) throw err;
          console.log("1 document inserted")
        })
      }
      db.close()      
    })
  })
  .catch(err => {
    console.log('err', err)
  })

  function generateRows(node, rows, index = 1){
    node.index = index++
    rows['id'].push(node.index)
    rows['pos'].push(node.pos())
    if(node.parent()) rows['parent'].push(node.parent().index)
    else rows['parent'].push(0)
    
    node.children().forEach(child => { index = generateRows(child, rows, index)})
    return index
  }


