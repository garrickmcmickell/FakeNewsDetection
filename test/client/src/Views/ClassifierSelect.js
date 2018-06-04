import React from 'react'

const ClassifierSelect = (props) => {
  this.selection = 'default'

  const handleChange = (event) => {
    this.selection = event.target.value
  }
  
  const handleSubmit = (event) => {
    event.preventDefault()
    if(this.selection !== 'default') props.handler('classifierSelected')
  }

  return (
    <form onSubmit={handleSubmit}>
      <select onChange={handleChange}>
        <option value='default'>---</option>
        <option value='straight'>Just News</option>
        <option value='editorial'>Editorial Content</option>
        <option value='cherry'>Cherry-Picked Facts</option>
        <option value='fake'>Fake News</option>
        <option value='satire'>Satire</option>
      </select>
      <button type='submit'>Submit</button>
    </form>
  )
}

export default ClassifierSelect