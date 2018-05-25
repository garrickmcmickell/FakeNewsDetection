'use strict'

const globalKeys = ['accesskey', 'class', 'contenteditable', 'contextmenu', 'data-', 'dir', 'draggable', 'dropzone', 'hidden', 'id', 'lang', 'spellcheck', 'style', 'tabindex', 'title', 'translate']
const eventKeys = ['onafterprint', 'onbeforeprint', 'onbeforeunload', 'onerror', 'onhashchange', 'onload', 'onmessage', 'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpopstate', 'onresize', 'onstorage', 'onunload']

const dict = {
  tagsWithoutEndTag: ['meta', 'link'],
  tagsWithEndTag: ['script', 'style'],
  metaKeys: ['charset', 'content', 'http-equiv','itemprop', 'name', 'property', 'scheme'].concat(globalKeys),
  linkKeys: ['charset', 'crossorigin', 'href', 'hreflang', 'media', 'rel', 'rev', 'sizes', 'target', 'type'],
  scriptKeys: ['src', 'type', 'name']
}

class ScrubWebsite {
  constructor() {
    this._dict = dict
  }

  scrub(body) {
    let obj = {}
    body = this._scrubDOCTYPE(body, obj)
    body = this._scrubComments(body, obj)
    console.log()
  }

  static _scrubDOCTYPE(body, obj) {
    let regex = new RegExp('(?:<!DOCTYPE )([^>\s]*)(?:\s?)([^>]*)(?:\/?>)', 'gmsi')
    body = body.replace(regex, function(sel, type, cont) {
      obj['DOCTYPE'] = cont.length ? { type: type, content: cont } : { type: type }
      return ''
    })
    return body
  }

  static _scrubComments(body, obj) {
    let regex = new RegExp('(?:<!--)(.*?)(?:-->)', 'gmsi')
    body = body.replace(regex, function(sel, cont) {
      obj['commentData'] ? obj['commentData'].push(cont) : obj['commentData'] = [cont]
      return ''
    })
    return body    
  }

  //Check body for all tags that don't have a separate end tag using dict
  //values for tagsWithoutEndTag. Search each found tag for list of properties
  //using that tag's key values defined in dict at key 'tag'Keys. Save all
  //found properties as a dict of {prop: value}. If obj has key 'tag'Data,
  //push the property dict onto the array at that key. If it doesn't have the
  //key, create it with the value being an array containing the property dict.
  //After data is saved to obj, remove the found tag from the document body.
  _scrubTagsWithoutEndTag(body, obj) { 
    dict.tagsWithoutEndTag.forEach(tag => {
      let regex = new RegExp('(?:<' + tag + ' )([^>]*)(?:\/?>)', 'gmsi') //(?:<tag )([^>]*)(?:\/?>)
      body = body.replace(regex, function(sel, prop) {
        let props = {}
        dict[tag + 'Keys'].forEach(key => {
          let regex = new RegExp('(?:' + key + '=")([^"]*)(?:")')
          if(regex.test(sel)) props[key] = sel.match(regex)[1]
        })
        obj[tag + 'Data'] ? obj[tag + 'Data'].push(props) : obj[tag + 'Data'] = [props]
        return ''
      })
    })
  }

  //Works like scrubTagsWithoutEndTag, but uses dict values for tagsWithEndTag.
  //Uses the same process as above, but finds a set of open/close tags and the
  //content betweeen them. Saves properties of tags like scrubTagsWithoutEndTag,
  //but adds the content between the opening and closing tag as a property in
  //the properties dict. Saves data to obj. Removes found tag from document body.
  _scrubTagsWithEndTag(body, obj) {
    dict.tagsWithEndTag.forEach(tag => {
      let regex = new RegExp('(?:<' + tag + '\s?([^>]*)>)(.*?)(?:<\/' + tag + '>)', 'gmsi') //(?:<tag\s?([^>]*)>)(.*?)(?:<\/tag>)
      body = body.replace(regex, function(sel, prop, cont) {
        let props = {}
        if(prop.length) dict[tag + 'Keys'].forEach(key => {
          let regex = new RegExp('(?:' + key + '=")([^"]*)(?:")')
          if(regex.test(sel)) props[key] = sel.match(regex)[1]
        })
        if(cont.length) props['content'] = cont
        obj[tag + 'Data'] ? obj[tag + 'Data'].push(props) : obj[tag + 'Data'] = [props]
        return ''
      })
    })
  }
}
ScrubWebsite._dict = dict
module.exports = ScrubWebsite