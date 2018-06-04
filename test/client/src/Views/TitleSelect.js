import React from 'react'

const LineRadio = (props) => {
  const handleChange = (event) => {
    props.handler(props.line)
  }

  return (
    <label className="lineRadioContainer">
      {props.line.content}
      <input onChange={handleChange} type="radio" name='radio'/>
      <span className="lineRadioCheckmark"></span>
    </label>
  )
}

const LineRadioList = (props) => {
  let i = 0
  return (
    <div>
      {props.lines.map(line => <LineRadio key={'line' + i++} handler={props.handler} name={props.name} line={line}/>)}
    </div>
  )
}

const TitleListForm = (props) => {
  const handleSelect = (title) => {
    this.title = title
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if(this.title) props.handler(this.title)
  }

  const titleList = Object.keys(props.titleCandidates).map(key => {
    return (
      <div key={'divForlineList' + key}>        
        <h2>Rank {key}</h2>
        <LineRadioList key={'lineList' + key} handler={handleSelect} name='titles' lines={props.titleCandidates[key]}/>
      </div>
    )
  })

  return (
    <form onSubmit={handleSubmit}>
        {titleList}
        <button type="Submit" className='button'>Select Title</button>
    </form>
  )
}

const TitleSelect = (props) => {
  const handler = (title) => {
    props.handler('titleSelected', title)
  }
  
  return (
    <div>
      <h1>Select Title</h1>
      <TitleListForm handler={handler} titleCandidates={props.titleCandidates}/>
    </div>
  )
}

export default TitleSelect