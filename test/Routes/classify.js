const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English')
const mongoUrl = "mongodb://localhost:27017/" 

module.exports = (req, res) => {
  console.log('Classify API hit')
  console.log('Body received: ' + JSON.stringify(req.body))
  classifyDocument(req.body)
  res.send({})
}

function classifyDocument(document) {
  saveAsPlain(document)
}

function saveAsPlain(document) {
  MongoClient.connect(mongoUrl, function(err, db) {
    if(err) throw err
    const dbo = db.db('classifiedArticles')
    const coll = dbo.collection('articlePlain')
    coll.insertOne(document, function(err, res) {
      if(err) throw err
      console.log('1 document inserted')
      db.close()
    })
  })
}