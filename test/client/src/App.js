import React, { Component } from 'react';
import StartPage from './Views/StartPage'
import TitleSelect from './Views/TitleSelect'
import './Styles/App.css';

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
  console.log(props.selectedLines)
  const selectedLines = props.selectedLines
  console.log(selectedLines)

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
    props.handler('linesSelected', selectedLines)
  }

    return (      
      <form onSubmit={handleSubmit}>
        <LineButtonList handler={lineHandler} lines={props.lines} selectedLines={props.selectedLines}/>
        <button type="submit" className='button'>Select Lines</button>
      </form>
    )
}



class Banner extends Component {
	render() {
  	return (
    	<div className='banner'>
    	  <button type='button' className='bannerButton'>About</button>
    	</div>
    )
  }
}

const Body = (props) => {
  const confirmLines = () => {
    props.handler('linesConfirmed')
  }

  const rejectLines = () => {
    props.handler('linesRejected')
  }

  const stage = props.state.stage

    if(stage === 'urlNotAccepted') {
      return (
        <StartPage handler={props.handler}/>
      )
    }
    else if(stage === 'urlAccepted') {
      return (
        <TitleSelect handler={props.handler} titleCandidates={props.state.titleCandidates}/>
      )
    } 
    else if(stage === 'titleSelected' || stage === 'linesRejected') {
      console.log(props)
      return (
        <div>
          <h1>{props.state.titleContent}</h1>
          <ArticleListForm handler={props.handler} lines={props.state.lines} selectedLines={props.state.selectedLines}/>
        </div>
      )
    }
    else if(stage === 'linesSelected') {
      return (
        <div>
          <h1>{props.state.title}</h1>
          {props.state.selectedLines.map((line, index) => <p key={'line' + index}>{line.text}</p>)}
          <h3>Is this right?</h3>
          <button onClick={confirmLines} type='button' className='button'>Yes</button>
          <button onClick={rejectLines} type='button' className='button'>No</button>
        </div>
      )
    }
    else {
      return (
        <h1>Article accepted</h1>
      )
    }

}

class App extends Component {
  constructor(props) {
    super(props)
    this.handler = this.handler.bind(this)
    this.state = {stage: 'urlNotAccepted'}
  }
  
  handler(e, props) {
    if(e === 'urlAccepted') {
      this.setState({
        titleCandidates: props['titleCandidates'],
        lines: props['lines'],
        stage: 'urlAccepted'
      })
    }
    if(e === 'titleSelected') {
      console.log('Title selected :' + props.content)
      console.log('Index of title: '+ props.index)
      this.state.lines.splice(0, props.index + 1)
      this.setState({
        stage: 'titleSelected',
        titleContent: props.content,
        titleIndex: props.index,
        selectedLines: []
      })
    }
    if(e === 'lineSelected' && (this.state.stage === 'titleSelected' || this.state.stage === 'linesRejected')) {
      if(!props[1]) {
      console.log('Line added: ' + props[0])
      let selectedLines = this.state.selectedLines
      selectedLines.push(props[0])
      this.setState({
        selectedLines: selectedLines
      })
      }
      else {
        console.log('Line removed: ' + props[0])
        let selectedLines = this.state.selectedLines
        selectedLines = selectedLines.filter(line => line !== props[0])
        this.setState({
          selectedLines: selectedLines
        })
      }
    }
    if(e === 'linesSelected') {
      console.log(props)
      this.setState({
        stage: e,
        selectedLines: props.sort((a, b) => { return a.index - b.index })
      })
    }
    if(e === 'linesRejected') {
      this.setState({
        stage: e
      })
    }
  }
  
  render() {
    return (
      <div className='body'>
        <Banner />        
        <div className='content'>
          <div className='filter'></div>
          <Body handler={this.handler} state={this.state}/>
        </div>
      </div>
    )
  }
}

export default App;
