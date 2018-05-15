const fs = require('fs')
const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const text = fs.readFileSync('./sampleSentencesFake.txt', 'utf8')
//const text = "This is my sample sentence, which is short."

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
        let obj = {}
        const tree = CoreNLP.default.util.Tree.fromSentence(doc.sentence(i), true)

        test(tree.rootNode, obj)
        
        dbo.collection("struct2test").insertOne( obj , function(err, res) {
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

  function test(node, obj = {}) {
    var arr = []    

    for(let i = 0; i < node.children().length; i++) {
      var temp = test(node.children()[i], obj)
      temp.forEach(value => { arr.push(value) })
    }
    
    let offset = 0
    for(let i = arr.length - 1; i >= 0; i--, offset++) {
      arr.unshift(node.pos() + arr[i + offset])
      obj[arr[0]] = obj.hasOwnProperty(arr[0]) ? obj[arr[0]] + 1 : 1
      arr.pop()
    }

    arr.push(node.pos())
    obj[node.pos()] = obj.hasOwnProperty(node.pos()) ? obj[node.pos()] + 1 : 1
    return arr
  }

  function getCounts(node, obj = {}) {
    //Deep first
    node.children().forEach(child => { obj = getCounts(child, obj)})
    
    //Add terminality of node
    if(node.children().length) obj['nonterminal'] = obj.hasOwnProperty('nonterminal') ? obj['nonterminal'] + 1 : 1      
    else obj['terminal'] = obj.hasOwnProperty('terminal') ? obj['terminal'] + 1 : 1

    //Add pos 

    return obj
  }

  function generateRows(node, rows, index = 1){
    node.index = index++
    rows['id'].push(node.index)
    rows['pos'].push(node.pos())
    if(node.parent()) rows['parent'].push(node.parent().index)
    else rows['parent'].push(0)
    
    node.children().forEach(child => { index = generateRows(child, rows, index)})
    return index
  }

  function method(a, b) {
    return a > b ? a + b : a - b
  }

