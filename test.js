import CoreNLP, { Properties, Pipeline } from 'corenlp';
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

const props = new Properties({
  annotators: 'tokenize,ssplit,pos,lemma,parse,depparse' //tokenize,ssplit,pos,lemma,parse,sentiment
})
const pipeline = new Pipeline(props, 'English') 

const doc = new CoreNLP.simple.Document("There was late worry that Blankenship was gaining steam in the race's final days, but he ended up finishing behind Patrick Morrisey, the state attorney general, and Rep. Evan Jenkins, who was seen as the establishment favorite in the race. Such concern was so deep that the president himself weighed in Monday morning on Twitter to warn that Blankenship could repeat the loss of the disastrous Alabama nominee that cost the GOP a winnable seat last year. When Blankenship conceded on Tuesday night in remarks to supporters, he blamed Trump's finger on the scale for the late flameout. Blankenship, the former CEO of Massey Energy, spent a year in federal prison for violating safety laws after an explosion at one of his mines killed 29 men. He put millions of dollars of his own wealth into ads to try to rehabilitate his image, and many saw his outsider persona and way he talked of being a victim of the GOP establishment as very Trumplike. In the final days of the race, an all-out battle between Blankenship and Republican leadership erupted after Blankenship ran ads with racially charged attacks on Senate Majority Leader Mitch McConnell's Asian in-laws. Morrisey had the endorsement of Texas Sen. Ted Cruz and pitched himself as the true conservative in the race. But his opponents had criticized him as a carpetbagger after just moving to the state in 2006, and Democrats will also revive attacks on his past lobbying for pharmaceutical companies as a liability in the general election. Like many Democrats, incumbent Manchin is raising a lot of money compared with Republicans. But a little-known progressive candidate whom he outspent $2.7 million to $130,000 still managed to get 30 percent of the vote against him in the primary, which could be a worrisome sign for the centrist Manchin if the state's base isn't fully behind him.")
//var parser = new CoreNLP.simple.annotator.ParserAnnotator({'binaryTrees': 'true'});
//doc.addAnnotator(parser);
var paragraph = {}

pipeline.annotate(doc)
  .then(doc => {
    var arr = []
    
    for(var i = 0; i < doc.sentences().length; i++) {
      //paragraph['Sentence ' + i] = { 'sentPosWordPosStruct' : '', 'sentPosWordStruct' : '', 'sentPosStruct' : '', 'wordPosStruct' : '', 'sentPosCount' : {} , 'wordPosCount' : {} , 'punctCount' : {}, 'tree' : {} }
      paragraph['Sentence' + i] = {}
      var tree = CoreNLP.util.Tree.fromSentence(doc.sentence(i));
      //var test = CoreNLP.util.Tree._buildTree(doc.sentence(i).sentimentTree())    
      //paragraph['Sentence ' + i]['tree'] = getNode(tree, tree.rootNode, i)
      //console.log(JSON.stringify(paragraph));
      var obj = {}
      //format(tree.rootNode, arr)
      format2(tree.rootNode, obj);
      arr.push(obj);
      //console.log(arr)
    }

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("jsAppTest");
      dbo.collection("textData").insertMany(arr, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });
    //var tree = CoreNLP.util.Tree.fromSentence(doc.sentence(0));
    //console.log(tree.dump());
    //console.log(doc.sentence(0).parse()); 
  })
  .catch(err => {
    console.log('err', err);
  });

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

