import React, { Component } from 'react';
import StartPage from './Views/StartPage'
import TitleSelect from './Views/TitleSelect'
import LineSelect from './Views/LineSelect';
import ConfirmPage from './Views/ConfirmPage';
import './Styles/App.css';


const Banner = () => {
  return (
    <div className='banner'>
      <button type='button' className='bannerButton'>About</button>
    </div>
  )
}

const Body = (props) => {
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
      return (
        <LineSelect handler={props.handler} titleContent={props.state.titleContent} lines={props.state.lines} selectedLines={props.state.selectedLines}/>
      )
    }
    else if(stage === 'linesSelected') {
      return (
        <ConfirmPage handler={props.handler} titleContent={props.state.titleContent} selectedLines={props.state.selectedLines}/>
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
        stage: 'urlAccepted',
        titleCandidates: props.titleCandidates,
        lines: props.lines
      })
    }
    if(e === 'titleSelected') {
      this.state.lines.splice(0, props.index + 1)
      this.setState({
        stage: 'titleSelected',
        titleContent: props.content,
        titleIndex: props.index,
        selectedLines: []
      })
    }
    if(e === 'linesSelected') {
      console.log(props)
      this.setState({
        stage: 'linesSelected',
        selectedLines: props.sort((a, b) => { return a.index - b.index })
      })
    }
    if(e === 'linesRejected') {
      this.setState({
        stage: 'linesRejected'
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

export default App
