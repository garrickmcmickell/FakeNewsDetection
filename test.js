import CoreNLP, { Properties, Pipeline } from 'corenlp';
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

const props = new Properties({
  annotators: 'tokenize,ssplit,pos,lemma,parse,depparse' //tokenize,ssplit,pos,lemma,parse,sentiment
})
const pipeline = new Pipeline(props, 'English') 

const doc = new CoreNLP.simple.Document('Friday’s summit meeting between the leaders of North and South Korea was a master class in diplomatic choreography, with each scene arranged for its power as political theater and broadcast live. In a perilous standoff that has resisted solutions, it was these images that offered hope, much more than the actual results from the meeting — vague pledges to work toward nuclear disarmament and a peace treaty.')
//var parser = new CoreNLP.simple.annotator.ParserAnnotator({'binaryTrees': 'true'});
//doc.addAnnotator(parser);
var paragraph = {}

pipeline.annotate(doc)
  .then(doc => {
    for(var i = 0; i < doc.sentences().length; i++) {
      //paragraph['Sentence ' + i] = { 'sentPosWordPosStruct' : '', 'sentPosWordStruct' : '', 'sentPosStruct' : '', 'wordPosStruct' : '', 'sentPosCount' : {} , 'wordPosCount' : {} , 'punctCount' : {}, 'tree' : {} }
      paragraph['Sentence' + i] = {}
      var tree = CoreNLP.util.Tree.fromSentence(doc.sentence(i));
      //var test = CoreNLP.util.Tree._buildTree(doc.sentence(i).sentimentTree())    
      //paragraph['Sentence ' + i]['tree'] = getNode(tree, tree.rootNode, i)
      //console.log(JSON.stringify(paragraph));
      var test = format(tree.rootNode)
      console.log(test)
    }

    /*MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("jsAppTest");
      dbo.collection("textData").insertOne(paragraph, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });*/
    //var tree = CoreNLP.util.Tree.fromSentence(doc.sentence(0));
    //console.log(tree.dump());
    //console.log(doc.sentence(0).parse()); 
  })
  .catch(err => {
    console.log('err', err);
  });

function format(node) {
  var currentJson = {}
  currentJson['pos'] = node.pos()
  for(var i = 0; i < node.children().length; i++) {
    currentJson['child' + i] = format(node.children()[i])
    Object.keys(currentJson['child' + i]).reverse().forEach(child =>{
      if(child !== 'pos') {
        if(currentJson['child' + i][child] === undefined) {
          console.log('stop')
        }
          
          //console.log(currentJson['child' + i][child])
        currentJson['child' + i + child] = currentJson['child' + i][child]//['pos']
        //currentJson[child] = currentJson['child' + i][child]['pos']
      }
      else {
        //if(currentJson['child' + i].length <= 1) {
          currentJson['child' + i] = currentJson['child' + i]['pos']
        //}
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

