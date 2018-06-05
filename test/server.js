const express = require('express')
const bodyParser = require('body-parser');

const app = express()
const port = process.env.PORT || 5000;

const routes = require('./Routes')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/', routes)

app.listen(port, () => console.log(`Listening on port ${port}`));
 


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