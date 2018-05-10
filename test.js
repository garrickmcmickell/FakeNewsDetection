import CoreNLP, { Properties, Pipeline } from 'corenlp';
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

const props = new Properties({
  annotators: 'tokenize,ssplit,pos,lemma,parse,depparse' //tokenize,ssplit,pos,lemma,parse,sentiment
})
const pipeline = new Pipeline(props, 'English') 

const doc = new CoreNLP.simple.Document("William Saletan reports on two philosophers, writing in the Journal Of Medical Ethics, who make a pro-choice case for infanticide, calling it “after-birth abortion.” Among their reasons: 3. Any burden on the woman outweighs the value of the child. Giubilini and Minerva note that philosophers such as Peter Singer have presented arguments for neonaticide for many years. Until now, these arguments have focused on what’s best for the baby—in the words of recent Dutch guidelines, “infants with a hopeless prognosis who experience what parents and medical experts deem to be unbearable suffering.” Giubilini and Minerva merely push this idea one step further, calling their proposal “‘after-birth abortion’ rather than ‘euthanasia’ because the best interest of the one who dies is not necessarily the primary criterion for the choice.” “Actual people’s well-being could be threatened by the new (even if healthy) child requiring energy, money and care which the family might happen to be in short supply of,” they observe. Accordingly, “if economical, social or psychological circumstances change such that taking care of the offspring becomes an unbearable burden on someone, then people should be given the chance of not being forced to do something they cannot afford.” An after-birth abortion might be warranted by any “interests of actual people (parents, family, society) to pursue their own well-being”—including “the interests of the mother who might suffer psychological distress from giving her child up for adoption.” 4. The value of life depends on choice. Pro-choicers don’t accept the idea that the path from pregnancy to maternity, being natural, must be followed. They argue that the choice is up to the woman. Some assert that the life within her has no moral status until she chooses to give birth to it. Again, Giubilini and Minerva simply extend this logic beyond birth. Since the newborn isn’t a person yet, its significance continues to hinge on its mother’s decision. Neonates “might or might not become particular persons depending on our choice,” the authors argue. Until then, the newborn imposes no obligations on us, “because we are not justified in taking it for granted that she will exist as a person in the future. Whether she will exist is exactly what our choice is about.” Saletan says that this argument is not a threat to pro-lifers, but to pro-choicers. Why? Here: The challenge posed to Furedi and other pro-choice absolutists by “after-birth abortion” is this: How do they answer the argument, advanced by Giubilini and Minerva, that any maternal interest, such as the burden of raising a gravely defective newborn, trumps the value of that freshly delivered nonperson? What value does the newborn have? At what point did it acquire that value? And why should the law step in to protect that value against the judgment of a woman and her doctor? Great questions. Once you declare that some life is unworthy of life, where do you draw the line?")
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
      dbo.collection("fakeNews").insertMany(arr, function(err, res) {
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

