import React, { Component } from 'react';
import './App.css';

const Line = (props) => {
  return (
    <div><button>{props.text}</button></div>
  )
}

const LineList = (props) => {
  return (
    <div>
      {props.lines.map(line => <Line text={line}/>)}
    </div>
  )
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
  }
  state = {
    response: '',
    enteredURL: false,
    lines: [
      "This is a sentence.",
      "This is another sentence."
    ]
  }

  callApi = async (props) => {
    console.log('Api props: ' + props)
    const response = await fetch('/url');
    const body = await response.json();
    
    console.log('Lines scraped from URL: ' + body['lines'].length)

    this.setState({lines: body.lines})
    if (response.status !== 200) throw Error(body.message);

    return body;
  };
  
  handler(e, props) {
    if(e === 'urlRequested') {
      console.log('Handler props: ' + props)  
      this.callApi(props)
      this.setState({
        enteredURL: true
      })
    }
    /*if(e === 'urlAccepted') {
      this.setState({
        enteredURL: true
      })
    }*/
  }
  
  render() {
    if(!this.state.enteredURL) {
      return (
        <Form handler={this.handler}/>
      )
    }
    if(this.state.enteredURL) {
      return (
        <div>
          <h1>Select lines</h1>
          <LineList lines={this.state.lines}/>
        </div>
      )
    }  
  }
}

export default App;
