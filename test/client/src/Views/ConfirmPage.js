import React from 'react';

const ConfirmPage = (props) => {
  const confirmLines = () => {
    props.handler('linesConfirmed')
  }

  const rejectLines = () => {
    props.handler('linesRejected')
  }

  return (
    <div>
      <h1>{props.titleContent}</h1>
      {props.selectedLines.map((line, index) => <p key={'line' + index}>{line.text}</p>)}
      <h3>Is this right?</h3>
      <button onClick={confirmLines} type='button' className='button'>Yes</button>
      <button onClick={rejectLines} type='button' className='button'>No</button>
    </div>
  )
}

export default ConfirmPage