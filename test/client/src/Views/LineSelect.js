import React, { Component } from 'react'

class LineButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
    	text: props.text,
      isToggleOn: props.toggle ? true : false,
      style: props.toggle ? this.selected : this.notSelected
    }
  }

  notSelected = {
    backgroundColor: 'MintCream',
    border: '1px solid LightSteelBlue',
    borderRadius: '2px',
    padding: '5px',
    fontSize: '16px',
    textAlign: 'left'
  }

  selected = {
    backgroundColor: 'LightBlue',
    border: '1px solid LightSteelBlue',
    borderRadius: '2px',
    padding: '5px',
    fontSize: '16px',
    textAlign: 'left'
  }

  handleClick = (event) => {
    this.setState(prevState => ({ isToggleOn: !prevState.isToggleOn }))
    
    if(this.state.isToggleOn) this.setState({ style: this.notSelected })
    else this.setState({ style: this.selected })

    this.props.handler({ index: this.props.index, text: this.state.text, remove: this.state.isToggleOn})
  }

  render() {
    return (
        <div>
          <button onClick={this.handleClick} style={this.state.style} type="button" id='line'>
            {this.state.text}
          </button>
        </div>
    )
  }
}

const LineButtonList = (props) => {
  let i = 0;
  return (
    <div>
      {props.lines.map((line, index) => {
        if(props.selectedLines.some(line => line.index === index)) 
          return <LineButton key={'line' + i} index={i++} handler={props.handler} text={line} toggle={true}/>
        else
          return <LineButton key={'line' + i} index={i++} handler={props.handler} text={line}/>
      }
    )}
    </div>
  )
}

const ArticleListForm = (props) => {
  const selectedLines = props.selectedLines

  const lineHandler = (props) => {    
    if(!props.remove)
      selectedLines.push({ index: props.index, text: props.text })
    else
      selectedLines.splice(selectedLines.findIndex(line => line.index === props.index), 1)
    
    selectedLines.sort((a, b) => {
      return a.index - b.index 
    })
  }
  
  const handleSubmit = (event) => {
    event.preventDefault()
    props.handler(selectedLines)
  }

    return (      
      <form onSubmit={handleSubmit}>
        <LineButtonList handler={lineHandler} lines={props.lines} selectedLines={props.selectedLines}/>
        <button type="submit" className='button'>Select Lines</button>
      </form>
    )
}

const LineSelect = (props) => {
  const handler = (selectedLines) => {
    props.handler('linesSelected', selectedLines)
  }
  
  return (
    <div>
      <h1>{props.titleContent}</h1>
      <ArticleListForm handler={handler} lines={props.lines} selectedLines={props.selectedLines}/>
    </div>
  )
}

export default LineSelect