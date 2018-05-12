
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

      //console.time('total')

      const mats = {}
      for(let i = 0; i < doc.sentences().length; i++) {
        
        //console.time('treeTotal' + i)
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)
        //console.timeEnd('treeTotal' + i)
        
        //console.time('matTotal' + i)
        mats[i] = convertTreeToMatrix(tree)
        //console.timeEnd('matTotal' + i)

        dbo.collection("matrix").insertOne( { matrix: mats[i] }, function(err, res) {
          if (err) throw err;
          //console.log("1 document inserted")
        })
      }
      db.close()
      
      //console.timeEnd('total')
    })
  })
  .catch(err => {
    console.log('err', err)
  })

function convertTreeToMatrix(tree) {  
  
  //console.time('nodeCount')
  const nodeCount = countNodes(tree.rootNode)
  //console.timeEnd('nodeCount')

  //console.time('generateMatrix')
  const mat = generateMatrix(nodeCount)
  //console.timeEnd('generateMatrix')

  //console.time('fillMatrixNodes')
  fillMatrixNodes(tree.rootNode, mat)
  //console.timeEnd('fillMatrixNodes')

  console.time('shrinkMatrix')
  shrinkMatrix(mat, nodeCount)
  console.timeEnd('shrinkMatrix')

  return mat
}

function countNodes(node, count = 0) {
  count++, node.children().forEach(child => { count = countNodes(child, count) })
  return count
}

function generateMatrix(count) {
  const mat = []
  for(let i = 0; i < count; i++) mat.push(Array(count).fill(0))
  return mat
}

function fillMatrixNodes(node, mat, row = -1) {  
  node.index = ++row, node.children().forEach(child => { row = fillMatrixNodes(child, mat, row)})
  if(node.parent()) mat[node.index][node.parent().index] = 1, mat[node.parent().index][node.index] = 1
  return row
}

function shrinkMatrix(mat, bits) {
  const bytes = Math.ceil(bits / 8)
  for(let i = 0; i < mat.length; i++) {
    const buffer = new ArrayBuffer(bytes)
    const view = new DataView(buffer) 
    for(let j = 0; j < (bytes * 8) - bits; j++) mat[i].unshift(0)
    let chunks = mat[i].join('').split(/(.{8})/g).filter(chunk => chunk != '')
    for(let j = 0; j < bytes; j++) view.setInt8(j, parseInt(chunks[j], 2))
    mat[i] = Buffer.from(buffer)
  }
}