import React from 'react'
import { connect } from 'react-redux'

function App ({ tasks }) {
  return (
    <div>
      <form>
        <input type='text' />
        <button>Add Task</button>
      </form>

      <ul>
        {tasks.map(({ key, description }) =>
          <li key={key}>{description}</li>
        )}
      </ul>
    </div>
  )
}

export default connect()(App)
