const he = require('he')
const express = require('express')
const Request = require('request')
const CoreNLP = require('corenlp')
var TextVersion = require("textversionjs");
const MongoClient = require('mongodb').MongoClient

const props = new CoreNLP.Properties({ annotators: 'tokenize,ssplit,pos,parse' })
const pipeline = new CoreNLP.Pipeline(props, 'English') 
const url = "mongodb://localhost:27017/"

const app = express()
const port = process.env.PORT || 5000;

app.get('/url/:url', (req, res) => {
  console.log('Url API hit')
  console.log('Url received: ' + req.params.url)
  const url = 'http://' + req.params.url.replace(/ /g, '/')
  console.log('Url recieved formatted: ' + url)
  getLinesFromUrl(url, function(err, result) {
    if (err) {
      console.log(err)
    }
    console.log('Lines grabbed from URL: ' + result.length)
    res.send(result)
  })
});

app.listen(port, () => console.log(`Listening on port ${port}`));

// http://www.collective-evolution.com/2016/10/18/15-quotes-on-false-flag-terrorism-the-secret-government-that-will-make-you-rethink-your-patriotism/
function getLinesFromUrl(url, callback) {
  console.log('URL requested: ' + url)
  Request(url, function(error, response, body) {
    if(error) {
      callback(error, null)
    }
    else {
      var params = {
        linkProcess: function(href, linkText) {
          return ' ' + linkText
        },
        imgProcess: function(src, alt) {
          return ''
        },
        headingStyle: 'hashify',
        listStyle: 'linebreak'
      }
      var test = TextVersion(body, params)
      
      test = test.replace(/<a.*?>(.*?)<\/a>\s?\n?/gmi, (sel, cont) => {
        if(cont.length) return (cont + '\n')
        else return '\n'
      })
      test = test.replace(/^<h([^a-z]).*?>/gmi, (sel, type) => {
        return '#'.repeat(parseInt(type)) + ' '
      })
      test = test.replace(/<h([^a-z]).*?>/gmi, '')
      test = test.replace(/<\/h([^a-z]).*?>/gmi, '')
      
      const titleCandidates = {}
      test = test.replace(/^(#+?)\s+(.*?)\s*?\n/gmi, (sel, head, cont) => {
        titleCandidates[head.length] ?
          titleCandidates[head.length].push(he.decode(cont)) :
          titleCandidates[head.length] = [he.decode(cont)]
        return cont
      })
      
      const lines = []
      test.match(/.*?\n/gm).forEach(line => {
        if(line != '\n') lines.push(he.decode(line).trim())
      })
    
      callback(null, { titleCandidates: titleCandidates, lines: lines })
    }
  })
}



 
  //Post-order depth-first search. Passes array of branch strings upwards,
  //starting at the leaf. Nodes construct strings by using current node and
  //appening all sub-tree branches in passed array, adding them to beginning
  //of the array, popping the sub-tree branch off of the array, pushing itself
  //on to array, and passing the array up to the parent for use in same process.
  //Result is an array of strings of all contained combinations of phrase chunks
  //for the given tree. 
  function phraseChainChunker(node, phraseChains = []) {
    var arr = []    
  
    node.children().forEach(child => {
      phraseChainChunker(child, phraseChains).forEach(value => arr.push(value))
    })

    arr.forEach(value => {
      arr.unshift('[' + node.pos() + arr[arr.length - 1] + ']'), arr.pop()
    })

    arr.push('[' + node.pos() + ']')
    arr.forEach(phraseChain => phraseChains.push(phraseChain))
    return arr
  }

  //Counts node parts-of-speech and parent-child parts of speech, which
  //are saved by key in an object.
  function phraseChunkerLite(node, obj = {}) {
    obj['[' + node.pos() + ']'] = 
        '[' + node.pos() + ']' in obj ? 
        obj['[' + node.pos() + ']'] + 1 : 1;

    node.children().forEach(child => {
      obj['[' + node.pos() + '][' + child.pos() + ']'] = 
          '[' + node.pos() + '][' + child.pos() + ']' in obj ?
          obj['[' + node.pos() + '][' + child.pos() + ']'] + 1 : 1;
      
      phraseChunkerLite(child, obj);
    });
  }

  //See ParseStructure doc.
  function getGridPositionsSpread(node, arr = [], index = {row: 0, rows: [{x: 0, y: 0}]}) {  
    if(index['rows'].length <= index['row']) 
      index['rows'].push({x: index['row'], y: index['rows'][index['row'] - 1]['y']})

    arr.push({pos: node.pos(), x: index['row'], y: index['rows'][index['row']]['y']})

    index['row']++
    node.children().forEach(child => {
      index = getGridPositionsSpread(child, arr, index)
      index['rows'][index['row']]['y'] += 1
    })

    index['row']--
    return index
  }

  //See ParseStructure doc.
  function getGridPositionsFlat(node, arr = [], row = 0) {
    if(row == 0) arr.push({ pos: node.pos(), x: 0, y: 0 })

    node.children().forEach((child, index) => {
      arr.push({ pos: child.pos(), x: row + 1, y: index })
      row = getGridPositionsFlat(child, arr, ++row)
    })
    
    return --row
  }