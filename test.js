
const CoreNLP = require('corenlp')
//import CoreNLP, { Properties, Pipeline } from 'corenlp'
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const doc =  new CoreNLP.default.simple.Document("The summit will be the first face-to-face meeting between a sitting American president and the North Korean leader. Releasing the hostages removed a significant obstacle for Mr. Trump as he heads into the peace talks. A senior United States official said their release was an American condition to the talks.")

pipeline.annotate(doc)
  .then(doc => {   
    const mats = []

    for(let i = 0; i < doc.sentences().length; i++) {
      const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)
      mats.push(convertTreeToMatrix(tree))
      //console.log(JSON.stringify(mat))
    }
    console.log(JSON.stringify(mats))
    /*MongoClient.connect(url, function(err, db) {
      if (err) throw err
      var dbo = db.db("jsAppTest")
      dbo.collection("fakeNews").insertMany(mats, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted")
        db.close()
      })
    })*/
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

function generateMatrix(node, mat = []) {
  mat.push([])
  node.children().forEach(child => { generateMatrix(child, mat) })
  return mat
}

function fillMatrix(mat) {
  for(let i = 0; i < mat.length; i++) 
    for(let j = 0; j < mat.length; j++) 
      mat[i].push(0)
}

function fillMatrixNodes(node, mat, row = -1) {  
  node.index = ++row
  node.children().forEach(child => { row = fillMatrixNodes(child, mat, row)})
  if(node.parent()) 
    mat[node.index][node.parent().index] = 1, mat[node.parent().index][node.index] = 1
  return row
}

function format2(node, obj = {}) {
  if(node.pos() !== '$') {
    obj[node.pos()] = node.pos() in obj ? obj[node.pos()] + 1 : 1;
  }
  else {
    obj['[' + node.pos() + ']'] = '[' + node.pos() + ']' in obj ? obj['[' + node.pos() + ']'] + 1 : 1;
  }
  node.children().forEach(child => {
    obj[node.pos() + child.pos()] = node.pos() + child.pos() in obj ? obj[node.pos() + child.pos()] + 1 : 1;
    format2(child, obj);
  });
}

function format(node, arr = []) {
  var currentJson = {}
  currentJson['pos'] = node.pos()
  arr.push(currentJson)

  for(var i = 0; i < node.children().length; i++) {
    currentJson['child' + i] = format(node.children()[i], arr)
    Object.keys(currentJson['child' + i]).reverse().forEach(child =>{
      if(child !== 'pos' && child !== 'children') {      
        currentJson['child' + i + child] = currentJson['child' + i][child]       
      }
      else {
        currentJson['child' + i] = currentJson['child' + i]['pos']
      }      
    })   
  }
  return currentJson
}
 
  
function getNode(tree, currentNode, sentenceIndex){    
  if(currentNode.word() == '') {
    var currentJson = {}
    currentJson['pos'] = currentNode.pos()
    currentJson['words'] = ''
    
    paragraph['Sentence ' + sentenceIndex]['sentPosWordPosStruct'] += '(' + currentNode.pos() 
    paragraph['Sentence ' + sentenceIndex]['sentPosWordStruct'] += '(' + currentNode.pos()
    paragraph['Sentence ' + sentenceIndex]['sentPosStruct'] += '(' + currentNode.pos()

    if(typeof paragraph['Sentence ' + sentenceIndex]['sentPosCount'][currentNode.pos()] == 'undefined')
      paragraph['Sentence ' + sentenceIndex]['sentPosCount'][currentNode.pos()] = 1
    else
      paragraph['Sentence ' + sentenceIndex]['sentPosCount'][currentNode.pos()] += 1
  }
  
  var count = 1

  currentNode.children().forEach(childNode => {
    if(childNode.word() == '') {      
      var childJson = getNode(tree, childNode, sentenceIndex)      
      currentJson['words'] = currentJson['words'] + childJson['words']
      currentJson['Seg ' + count++ + ' : Struct - ' + childJson['pos']] = childJson
    }
    else {      
      currentJson['words'] = currentJson['words'] + childNode.word() + ' '
      var childJson = {}
      childJson['pos'] = childNode.pos()
      childJson['word'] = childNode.word()
      currentJson['Seg ' +count++ + ' : Word - ' + childJson['pos']] = childJson
      
      paragraph['Sentence ' + sentenceIndex]['sentPosWordPosStruct'] += '(' + childNode.pos() + ')' 
      paragraph['Sentence ' + sentenceIndex]['sentPosWordStruct'] += '(' + childNode.word() + ')'
      paragraph['Sentence ' + sentenceIndex]['wordPosStruct'] += '(' + childNode.pos() + ')'

      if(!/[a-z0-9]+/i.test(childNode.word())) {
        paragraph['Sentence ' + sentenceIndex]['sentPosStruct'] += '(' + childNode.pos() + ')'

        if(typeof paragraph['Sentence ' + sentenceIndex]['punctCount'][childNode.pos()] == 'undefined')
          paragraph['Sentence ' + sentenceIndex]['punctCount'][childNode.pos()] = 1
        else
          paragraph['Sentence ' + sentenceIndex]['punctCount'][childNode.pos()] += 1
      }
      else if(typeof paragraph['Sentence ' + sentenceIndex]['wordPosCount'][childNode.pos()] == 'undefined')
        paragraph['Sentence ' + sentenceIndex]['wordPosCount'][childNode.pos()] = 1
      else
        paragraph['Sentence ' + sentenceIndex]['wordPosCount'][childNode.pos()] += 1
    }
  })
  
  paragraph['Sentence ' + sentenceIndex]['sentPosWordPosStruct'] += ')'
  paragraph['Sentence ' + sentenceIndex]['sentPosWordStruct'] += ')'
  paragraph['Sentence ' + sentenceIndex]['sentPosStruct'] += ')'

  return currentJson  
}

