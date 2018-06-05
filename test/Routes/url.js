const he = require('he')
const express = require('express')
const Request = require('request')
const TextVersion = require("textversionjs")

const router = express.Router()

router.get('/:url', (req, res) => {
  console.log('Url API hit')
  console.log('Url received: ' + req.params.url)
  const url = 'http://' + req.params.url.replace(/ /g, '/')
  console.log('Url recieved formatted: ' + url)
  getLinesFromUrl(url, function(err, result) {
    if (err) {
      console.log(err)
      res.send(err)
    }
    else {
      console.log('Lines grabbed from URL: ' + result.lines.length)
      res.send(result)
    }
  })
})

// http://www.collective-evolution.com/2016/10/18/15-quotes-on-false-flag-terrorism-the-secret-government-that-will-make-you-rethink-your-patriotism/
function getLinesFromUrl(url, callback) {
  console.log('URL requested: ' + url)
  Request(url, function(error, response, body) {
    if(error) {
      callback(error, null)
    }
    else {
      const params = {
        linkProcess: function(href, linkText) {
          return ' ' + linkText
        },
        imgProcess: function(src, alt) {
          return ''
        },
        headingStyle: 'hashify',
        listStyle: 'linebreak'
      }
      let test = TextVersion(body, params)
      
      test = test.replace(/<a.*?>(.*?)<\/a>\s?\n?/gmi, (sel, cont) => {
        if(cont.length) return (cont + '\n')
        else return '\n'
      })
      test = test.replace(/^<h([^a-z]).*?>/gmi, (sel, type) => {
        return '#'.repeat(parseInt(type)) + ' '
      })
      
      test = test.replace(/<h([^a-z]).*?>/gmi, '')
      test = test.replace(/<\/h([^a-z]).*?>/gmi, '')
      
      const lines = []
      test.match(/.*?\n/gm).forEach(line => {
        if(line != '\n') lines.push(he.decode(line).trim())
      })

      const titleCandidates = {}
      lines.forEach((line, index) => {
        lines[index] = line.replace(/^(#+?)\s+(.*)/, (sel, head, cont) => {
          const titleCandidate = { index: index, content: cont }
          titleCandidates[head.length] ? titleCandidates[head.length].push(titleCandidate) : titleCandidates[head.length] = [titleCandidate]
          return cont
        })
      })
    
      callback(null, { titleCandidates: titleCandidates, lines: lines })
    }
  })
}

module.exports = router