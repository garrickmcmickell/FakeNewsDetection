
const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const doc =  new CoreNLP.default.simple.Document("The summit will be the first face-to-face meeting between a sitting American president and the North Korean leader. Releasing the hostages removed a significant obstacle for Mr. Trump as he heads into the peace talks. A senior United States official said their release was an American condition to the talks.")

pipeline.annotate(doc)
  .then(doc => {   
    MongoClient.connect(url, function(err, db) {
      if (err) throw err
      const dbo = db.db("jsAppTest")    
      
      const mats = []
      for(let i = 0; i < doc.sentences().length; i++) {
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)
        mats.push(convertTreeToMatrix(tree))
        
        dbo.collection("matrix").insertOne( mats[i] , function(err, res) {
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

function convertTreeToMatrix(tree) {  
  const mat = generateMatrix(tree.rootNode)
  fillMatrix(mat)
  fillMatrixNodes(tree.rootNode, mat)
  return mat
}

function generateMatrix(node, mat = {}) {
  mat[Object.keys(mat).length] = []
  node.children().forEach(child => { generateMatrix(child, mat) })
  return mat
}

function fillMatrix(mat) {
  for(key in mat)
    for(key in mat) 
      mat[key].push(0)
}

function fillMatrixNodes(node, mat, row = -1) {  
  node.index = ++row
  node.children().forEach(child => { row = fillMatrixNodes(child, mat, row)})
  if(node.parent()) 
    mat[node.index][node.parent().index] = 1, mat[node.parent().index][node.index] = 1
  return row
}