import React from 'react'

const ClassifierSelect = (props) => {
  this.selection = 'default'

  const classifyDocument = async (classifier) => {
    try {
      const formattedLines = props.selectedLines.map(line => line.text)

      console.log(JSON.stringify({
        title: props.titleContent,
        lines: formattedLines,
        classifier: classifier
      }))

      //const response = await fetch('/classify');

      fetch('/classify/', {
        method: 'POST',
        body: JSON.stringify({
          title: props.titleContent,
          lines: formattedLines,
          classifier: classifier
        }),
        headers: {"Content-Type": "application/json"}
      })
      .then(function(response) {
        console.log(response)
      })
      //const body = await response.json();

      //if (response.status === 200) 
      //  console.log('Post success')
      //else
      //  console.log('Post fail')
    }
    catch(err) {
      console.log('Post fail')
      console.log(err)
    }
  }

  const handleChange = (event) => {
    this.selection = event.target.value
  }
  
  const handleSubmit = (event) => {
    event.preventDefault()
    if(this.selection !== 'default') classifyDocument(this.selection)
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