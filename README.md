# React Rx Actions

Seperate UI and Business logic using an unidirectional data-flow.


#### Business logic in Rx
```jsx
import { Action$, toReact } from 'react-rx-actions';

// Step 1. Listen to the Action$
Action$
  .ofType('LOGIN')
  .map(function(){
    /* do stuff */
    return { name: 'Mark', role: 'Admin'}
  })
  // Step 2. Publish data to React
  .map(user => ({ user }))
  .do(toReact('user'))
```

### UI in React
```jsx
import { createContainer, dispatch } from 'react-rx-actions';

// In your component
class MyComponent() extends Component {
  // Step 3. Render your data in react
  render() {
    <div>Current user: { this.props.user.name }</div>;
  }  

  // Step 4. Dispatch actions, goto step 1
  onLoginClick(){
    dispatch('LOGIN', {username: '...', password: '...' })
  }
}

export default createContainer(['user'])(MyComponent)
```
