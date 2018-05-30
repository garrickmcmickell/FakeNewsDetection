import React, { Component } from 'react';
import './App.css';

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
    this.props.handler('lineSelected', [this.state.line, this.state.isToggleOn])
  }

  render() {
    return (
      <label className="container">
        {this.state.line}
        <input onChange={this.handleChange} type="radio" name='radio'/>
        <span className="checkmark"></span>
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
        <div key={'divFor' + 'lineList' + value[0]}>        
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

class UrlForm extends Component {
  handleSubmit = (event) => {
    event.preventDefault()
    this.props.handler('urlRequested', this.url.value)
  }
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input type="text" 
          ref={(input) => this.url = input}
          placeholder="Enter Url" required/>
        <button type="submit" className='button'>Get Text</button>
      </form>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.handler = this.handler.bind(this)
    this.confirmLines = this.confirmLines.bind(this)
    this.rejectLines = this.rejectLines.bind(this)
    this.state = {urlEntered: false}
  }

  callApi = async (props) => {
    try {
      console.log('Api props: ' + props)
      const response = await fetch('/url/' + props);
      const body = await response.json();
      
      if (response.status !== 200) {
        this.setState({
          urlEntered: true,
          urlAccepted: false
        })
      }
      else {
        console.log(body)
        console.log('Title candidates scraped from Url: ' + Object.keys(body['titleCandidates']).length)
        console.log('Lines scraped from Url: ' + body['lines'].length)
    
        this.setState({
          titleCandidates: body['titleCandidates'],
          lines: body['lines'],
          urlEntered: true,
          urlAccepted: true
        })
      }
    } catch(err) {
      this.setState({
        urlEntered: true,
        urlAccepted: false
      })
    }
  };
  
  handler(e, props) {
    if(e === 'urlRequested') {
      console.log('Url requested: ' + props)
      let formattedUrl = props.replace(/https?:\/\//, '')
      formattedUrl = formattedUrl.replace(/\//g, ' ')
      console.log('Formatted Url: ' + formattedUrl)  
      this.callApi(formattedUrl)
    }
    if(e === 'lineSelected' && !this.state.titleSelected) {
      console.log('Line selected: ' + props[0])
      this.setState({
        title: props[0]
      })
    }
    if(e === 'titleSelected') {
      console.log('Title selected :' + this.state.title)
      console.log('Index of title: '+ this.state.lines.indexOf(this.state.title))
      this.state.lines.splice(0, this.state.lines.indexOf(this.state.title) + 1)
      this.setState({
        titleSelected: true,
        selectedLines: []
      })
    }
    if(e === 'lineSelected' && this.state.titleSelected) {
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
        linesSelected: true
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
    if(!this.state.urlEntered) {
      return (
        <UrlForm handler={this.handler}/>
      )
    }
    else if(!this.state.urlAccepted){
      return (
        <div>
          <UrlForm handler={this.handler}/>
          <h3>Url not accepted</h3>
        </div>
      )
    }
    else if(!this.state.titleSelected) {
      return (
        <div>
          <h1>Select Title</h1>
          <TitleListForm handler={this.handler} titleCandidates={this.state.titleCandidates}/>
        </div>
      )
    } 
    else if(!this.state.linesSelected) {
      return (
        <div>
          <h1>{this.state.title}</h1>
          <ArticleListForm handler={this.handler} lines={this.state.lines}/>
        </div>
      )
    }
    else if(!this.state.linesConfirmed) {
      return (
        <div>
          <h1>{this.state.title}</h1>
          {this.state.selectedLines.map(line => <p>{line}</p>)}
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

export default App;
