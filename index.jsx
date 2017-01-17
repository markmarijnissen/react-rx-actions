import 'rx-debug';
import React from 'react';
import Rx from 'rxjs';

const Streams = {};
export const ACTION_CASCADE = 'ACTION_CASCADE';

/**
 * Step 1. Action$
 *
 * Rx Stream with incoming user actions.
 */
const Dispatcher = new Rx.Subject();
export const Action$ = Dispatcher;
Action$.ofType = type => Action$
  .filter(event => {
    return typeof type === 'string'? event.type === type: type.indexOf(event.type) >= 0
  })
  .debug(`Action$[${type}]`);

/**
 * Step 2. Export stream to React (a 'controller')
 *
 * Usage: stream.do(toReact('name'))
 */
export const toReact = (name) => {
  const fn = function(){
    if(Streams[name]) {
      const err = `toReact: ${name} already exists!`;
      console.error(err);
      this.error(err);
    } else {
      Streams[name] = this;
    }
    return this;
  };
  fn.instanceMethod = true;
  return fn;
}

// MonkeyPatch 'do' to work
const _do = Rx.Observable.prototype.do;
Rx.Observable.prototype.do = function(fn){
  if(fn.instanceMethod) return fn.call(this);
  return _do.apply(this,arguments);
}

/**
 * Step 3. Connect Raect Components to Rxjs
 * using a Higher Order Component
 *
 * Usage: createContainer(['ctrlName'])(Component)
 */
export const createContainer = function(controllers){
  return function (WrappedComponent){
    let displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    displayName = `RxContainer(${displayName})`;

    return React.createClass({
      displayName: displayName,
      componentDidMount: function(){
          this._subscriptions = controllers.map(name => {
            if(!Streams[name]){
              throw new Error(
                `${displayName} cannot find controller ` +
                `${name} because observable.do(toReact('${name}')) was never called.

                Available controllers are: ${Object.keys(Streams).join(', ')}`
              );
            }
            console.log(`${displayName} subscribes to ${name}`);
            return Streams[name]
              .subscribe(this.handleControllerUpdate);
          })
      },
      componentWillUnmount: function(){
        this._subscriptions.forEach(sub => sub.unsubscribe())
      },
      handleControllerUpdate: function(value){
        this.setState(value);
      },
      render() {
        return <WrappedComponent dispatch={dispatch} {...this.props} {...this.state} />;
      }
    });
  }
}

/**
 * Step 4. Dispatch an event
 */
export const dispatch = function(action,data){
  if(typeof action === 'object'){
    data = action;
  } else if(typeof action === 'string'){
    data = data || {};
    data.type = action;
  }
  // Unidirectional data-flow: an action can NEVER trigger another action
  // You can trace everything from the Action stream down.
  if(Action$.busy){
    /* eslint no-console: "off" */
    console.error('Action$: ACTION_CASCADE',[ Action$.busy, data.action ]);
    Action$.error({ type: ACTION_CASCADE, actions: [ Action$.busy, data.action ]});
    return;
  }
  Dispatcher.busy = data.action;
  Dispatcher.next(data);
  Dispatcher.busy = false;
}
