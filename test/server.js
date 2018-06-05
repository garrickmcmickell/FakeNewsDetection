const express = require('express')
const bodyParser = require('body-parser');

const app = express()
const port = process.env.PORT || 5000;

const routes = require('./Routes')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/', routes)

app.listen(port, () => console.log(`Listening on port ${port}`));
 
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