import React, { Component } from 'react';
import './App.css';

class Line extends Component {
  constructor(props) {
    super(props)
    this.state = {line: props.text,
                  name: props.name,
                  isToggleOn: false}
  }

  handleClick = (event) => {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
    this.props.handler('lineSelected', this.state.line)
  }

  render() {
    let i = 0
    return (
      <div>
        <input onClick={this.handleClick} type="radio" id='line' name={this.state.name} value={this.state.line} checked={this.state.isToggleOn}/>
        <label htmlFor='line'>{this.state.line}</label>
      </div>
    )
  }
}

const LineList = (props) => {
  let i = 0
  return (
    <div>
      {props.lines.map(line => <Line key={'line' + i++} handler={props.handler} name={props.name} text={line}/>)}
    </div>
  )
}

class TitleList extends Component {
  handleSubmit = (event) => {
    event.preventDefault()
    this.props.handler('titleSelected')
  }
  render() {
    const titleList = Object.entries(this.props.titleCandidates).map(value => {
      return (
        <div key={'divFor' + 'lineList' + value[0]}>        
          <h2>Rank {value[0]}</h2>
          <LineList key={'lineList' + value[0]} handler={this.props.handler} name='titles' lines={value[1]}/>
        </div>
      )
    })
    return (
      <form onSubmit={this.handleSubmit}>
          {titleList}
          <button type="Submit">Select Title</button>
      </form>
    )
  }
}

class Form extends Component {
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
        <button type="submit">Get Text</button>
      </form>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.handler = this.handler.bind(this)
    this.state = {enteredURL: false}
  }

  callApi = async (props) => {
    console.log('Api props: ' + props)
    const response = await fetch('/url');
    const body = await response.json();
    
    console.log(body)
    console.log('Title candidates scraped from URL: ' + Object.keys(body['titleCandidates']).length)
    console.log('Lines scraped from URL: ' + body['lines'].length)

    this.setState({
      titleCandidates: body['titleCandidates'],
      lines: body['lines'],
      enteredURL: true
    })
    
    if (response.status !== 200) throw Error(body.message);

    return body;
  };
  
  handler(e, props) {
    if(e === 'urlRequested') {
      console.log('Url requested: ' + props)  
      this.callApi(props)
    }
    if(e === 'lineSelected' && !this.state.titleSelected) {
      console.log('Line selected: ' + props)
      this.setState({title: props})
    }
    if(e === 'titleSelected') {
      console.log('Title selected :' + this.state.title)
      console.log('Index of title: '+ this.state.lines.indexOf(this.state.title))
      this.state.lines.splice(0, this.state.lines.indexOf(this.state.title) + 1)
      this.setState({titleSelected: true})
    }
    //if(e === 'urlAccepted') {
    //  this.setState({
    //    enteredURL: true
    //  })
    //}
  }
  
  render() {
    if(!this.state.enteredURL) {
      return (
        <Form handler={this.handler}/>
      )
    }
    else if(!this.state.titleSelected) {
      return (
        <div>
          <h1>Select Title</h1>
          <TitleList handler={this.handler} titleCandidates={this.state.titleCandidates}/>
        </div>
      )
    } else if(!this.setState.linesSelected) {
      return (
        <div>
          <h1>{this.state.title}</h1>
          <LineList handler={this.handler} lines={this.state.lines}/>
        </div>
      )
    }
    //if(this.state.enteredURL) {
    //  return (
    //    <div>
    //      <h1>Select lines</h1>
    //      <LineList lines={this.state.lines}/>
    //    </div>
    //  )
    //}  
  }
}

export default App;
