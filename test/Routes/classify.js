const CoreNLP = require('corenlp')
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English')
const mongoUrl = "mongodb://localhost:27017/" 

module.exports = (req, res) => {
  console.log('Classify API hit')
  console.log('Body received: ' + JSON.stringify(req.body))
  res.send({})
}

function classifyDocument(url, callback) {

}