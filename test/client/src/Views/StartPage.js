import React, { Component } from 'react';

const TopText = () => {
  return (    
    <div className='startContentTop'>
      <p className='startQuote'>
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eu sagittis lorem. Donec tristique nisl vitae est congue, ut ullamcorper eros volutpat." – Lorem Ipsum
      </p>
      <p className='startText'>
        Curabitur eleifend nunc purus, porta pellentesque massa vulputate eget. Sed sit amet velit sapien. Suspendisse eleifend in dolor pulvinar efficitur. Ut commodo dui ac est molestie placerat. Aliquam placerat odio vitae lacus ultrices rutrum.
      </p>
    </div>
  )
}

const Status = (props) => {
  return (
    <div className='startContentStatus'>
      {props.status}
    </div>
  )
}

const Pending = () => {
  return (
    <h3 className='urlStatus' id='urlStatusPending'>
      Thinking.
    </h3>
  )
}

const Error = () => {
  return (
    <h3 className='urlStatus' id='urlStatusError'>
      Url not accepted.
    </h3>
  )
}

const UrlForm = (props) => { 
  const handleInput = (input) => {
    this.input = input
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    props.requestUrl(this.input.value)
  }

  return (
    <form onSubmit={handleSubmit.bind(this)} className='urlForm'>
      <TextInput handleInput={handleInput.bind(this)}/>
      <SubmitButton/>
    </form>
  )
}

const TextInput = (props) => {
  return (
    <div className='startContentMiddle'>
      <div className='startContentMiddleLeft'></div>
      <div className='startContentMiddleMiddle'>
        <div className='startContentMiddleDiv'>
          <input type="text" className='textInput' ref={(input) => props.handleInput(input)} placeholder="Enter Url" required/>
        </div>
      </div>
      <div className='startContentMiddleRight'></div>
    </div>
  )
}

const SubmitButton = () => {
  return (
    <div className='startContentBottom'>
      <button type="submit" className='button' id='enterUrl'>Start</button>
    </div>
  )
}

class StartPage extends Component {
  constructor(props) {
    super(props)
    this.state = { status: <div/> }
    this.requestUrl = this.requestUrl.bind(this)
  }

  async requestLines(requestedUrl) {
    try {
      this.setState({ status: <Status status={<Pending/>}/> })

      const response = await fetch('/url/' + requestedUrl);
      const body = await response.json();

      if (response.status == 200 && !body.code) 
        this.props.handler('urlAccepted', body)
      else
        this.setState({ status: <Status status={<Error/>}/> })
    }
    catch(err) {
      this.setState({ status: <Status status={<Error/>}/> })
    }
  }

  requestUrl(url) {
    let formattedUrl = url.replace(/https?:\/\//, '')
    formattedUrl = formattedUrl.replace(/\//g, ' ')
    this.requestLines(formattedUrl) 
  }

  render() {
    return (
      <div className='startContent'>
        <TopText/>
        {this.state.status}
        <UrlForm requestUrl={this.requestUrl}/>
      </div>
    )
  }
}

export default StartPage