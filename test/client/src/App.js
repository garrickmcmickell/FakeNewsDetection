import React, { Component } from 'react';
import StartPage from './Views/StartPage'
import './Styles/App.css';

class LineRadio extends Component {
  constructor(props) {
    super(props)
    this.state = {
    	line: props.text,
      isToggleOn: false
    }
  }

  handleChange = (event) => {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
    this.props.handler('lineRadioSelected', this.state.line)
  }

  render() {
    return (
      <label className="lineRadioContainer">
        {this.state.line}
        <input onChange={this.handleChange} type="radio" name='radio'/>
        <span className="lineRadioCheckmark"></span>
      </label>
    )
  }
}

class LineButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
    	text: props.text,
      isToggleOn: false,
      style: {
      	backgroundColor: 'MintCream',
        border: '1px solid LightSteelBlue',
        borderRadius: '2px',
        padding: '5px',
        fontSize: '16px',
        textAlign: 'left'
    	}
    }
  }

  handleClick = (event) => {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
    if(this.state.isToggleOn) {
      this.setState({
        style: {
        	backgroundColor: 'MintCream',
          border: '1px solid LightSteelBlue',
          borderRadius: '2px',
        	padding: '5px',
        	fontSize: '16px',
          textAlign: 'left'
      	}
      })
    }
    else {
      this.setState({
        style: {
        	backgroundColor: 'LightBlue',
          border: '1px solid LightSteelBlue',
          borderRadius: '2px',
        	padding: '5px',
        	fontSize: '16px',
          textAlign: 'left'
      	}
      })
    }
    this.props.handler('lineSelected', [this.state.text, this.state.isToggleOn])
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
  let i = 0
  return (
    <div>
      {props.lines.map(line => <LineButton key={'line' + i++} handler={props.handler} text={line}/>)}
    </div>
  )
}

const LineRadioList = (props) => {
  let i = 0
  return (
    <div>
      {props.lines.map(line => <LineRadio key={'line' + i++} handler={props.handler} name={props.name} text={line}/>)}
    </div>
  )
}

class ArticleListForm extends Component {
  handleSubmit = (event) => {
    event.preventDefault()
    this.props.handler('linesSelected')
  }

  render() {
    return (      
      <form onSubmit={this.handleSubmit}>
        <LineButtonList handler={this.props.handler} lines={this.props.lines}/>
        <button type="submit" className='button'>Select Lines</button>
      </form>
    )
  }
}

class TitleListForm extends Component {
  handleSubmit = (event) => {
    event.preventDefault()
    this.props.handler('titleSelected')
  }

  render() {
    const titleList = Object.entries(this.props.titleCandidates).map(value => {
      return (
        <div key={'divForlineList' + value[0]}>        
          <h2>Rank {value[0]}</h2>
          <LineRadioList key={'lineList' + value[0]} handler={this.props.handler} name='titles' lines={value[1]}/>
        </div>
      )
    })
    return (
      <form onSubmit={this.handleSubmit}>
          {titleList}
          <button type="Submit" className='button'>Select Title</button>
      </form>
    )
  }
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

class Body extends Component {
  render() {
    const stage = this.props.state.stage
    if(stage === 'urlNotAccepted') {
      return (
        <StartPage handler={this.props.handler}/>
      )
    }
    else if(stage === 'urlAccepted') {
      return (
        <div>
          <h1>Select Title</h1>
          <TitleListForm handler={this.props.handler} titleCandidates={this.props.state.titleCandidates}/>
        </div>
      )
    } 
    else if(stage === 'titleSelected') {
      return (
        <div>
          <h1>{this.props.state.title}</h1>
          <ArticleListForm handler={this.props.handler} lines={this.props.state.lines}/>
        </div>
      )
    }
    else if(stage === 'linesSelected') {
      return (
        <div>
          <h1>{this.props.state.title}</h1>
          {this.props.state.selectedLines.map((line, index) => <p key={'line' + index}>{line}</p>)}
          <h3>Is this right?</h3>
          <button onClick={this.confirmLines} type='button' className='button'>Yes</button>
          <button onClick={this.rejectLines} type='button' className='button'>No</button>
        </div>
      )
    }
    else {
      return (
        <h1>Article accepted</h1>
      )
    }
  } 
}

class App extends Component {
  constructor(props) {
    super(props)
    this.handler = this.handler.bind(this)
    this.confirmLines = this.confirmLines.bind(this)
    this.rejectLines = this.rejectLines.bind(this)
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
    if(e === 'lineRadioSelected' && this.state.stage === 'urlAccepted') {
      console.log('Line selected: ' + props)
      this.setState({
        title: props
      })
    }
    if(e === 'titleSelected') {
      console.log('Title selected :' + this.state.title)
      console.log('Index of title: '+ this.state.lines.indexOf(this.state.title))
      this.state.lines.splice(0, this.state.lines.indexOf(this.state.title) + 1)
      this.setState({
        stage: e,
        selectedLines: []
      })
    }
    if(e === 'lineSelected' && this.state.stage === 'titleSelected') {
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
      this.setState({
        stage: e
      })
    }
  }

  confirmLines() {
    this.setState({
      linesConfirmed: true
    })
  }

  rejectLines() {
    this.setState({
      linesSelected: false,
      selectedLines: []
    })
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
