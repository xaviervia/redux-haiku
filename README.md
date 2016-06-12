# <img src='redux-haiku.png' height='128' title='redux-haiku'>

> A saga is long, and rambles on.<br>
> A haiku goes to the point.<br>
> Change!<br>

**redux-haiku** is yet another way of managing side-effects in Redux: but don't be disheartened, because this time it's going to be so easy and natural that when you are done you're going to be left wondering why didn't we do it this way in the first place.

If you're using Redux, chances are that you are familiar with the [**Containers**](http://redux.js.org/docs/basics/UsageWithReact.html) from [`react-redux`](https://github.com/reactjs/react-redux): well, `redux-haiku` **Subscribers** work exactly like Containers, but they allow you to operate with any type of side-effect, not just DOM related ones.

Be mindful though, `redux-haiku` Subscribers are a rather low level API for implementing bindings between Redux stores and diverse side-effects: it's very likely that your application should be consuming a binding library that uses `redux-haiku` internally, instead of setting up Subscribers directly in the app. Of course, this is a new implementation, and such libraries do not exist: but they might in the future, especially if you create some. If there are bindings already out there for what you want to do (say, [connect the store to Falcor](https://github.com/ekosz/redux-falcor)) you're very likely better off using that.

Without further ado, take a look at how a Subscriber looks like:

```javascript
// subscribers/syncNew.js
import { connect, getDiff } from 'redux-haiku'
import * as actions from '../actions'
import { compose } from 'redux'
import axios from 'axios' // Simple XHR lib

const syncNew = ({ articles, onSuccess, onFailure }) => {
  articles.map((article) => {
    axios.put(`/articles/${article.key}`, { ...article })
      .then(() => onSuccess(article))
      .catch(() => onFailure(article))
  })
}

const mapStateToProps = (state, prevState) => {
  const getKeysSelector = (state) =>
    state &&
    state.articles &&
    state.articles.map(
      ({ key }) => key
    )

  const getArticleKeysDiff = getDiff(getKeysSelector)

  const newArticleKeys = getArticleKeysDiff(prevState, state).after

  return newArticleKeys && {
    articles: state.articles.filter(
      (article) => newArticleKeys.find((key) => key === article.key)
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  onSuccess: compose(dispatch, actions.saveSuccess),
  onFailure: compose(dispatch, actions.saveFailure)
})

export default connect(mapStateToProps, mapDispatchToProps)(syncNew)
```

Looks familiar, right? That's exactly the point. What `redux-haiku` proposes is that any side-effect can be treated just like a DOM side-effect–that is, it can be done as the result of a state change. The state change can be identified by running a diff between the new and the old states on the segment of the state that the side-effect cares about, in the meanwhile reusing established patterns such as selectors, `mapStateToProps`, `mapDispatchToProps`, etc.

Now, the "aha" moment of Redux plus React is time traveling: that's when we all realized that Redux proved its metal. Time traveling is a simple litmus test for identifying an architecture that makes for immutable, declarative apps. Time traveling for any kind of side-effects is what `redux-haiku` promises–with the only limitation that the side-effect operations need to be idempotent ones.

Since we are indeed using `PUT`, an [idempotent REST verb](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.6), let's assume that's the case. We can then go full circle with another subscriber, this time for synchronizing the removal of articles:

```javascript
// subscribers/syncDelete.js
import { connect, getDiff } from 'redux-haiku'
import * as actions from '../actions'
import { compose } from 'redux'
import axios from 'axios' // Simple XHR lib

const syncDelete = ({ articles, onSuccess, onFailure }) => {
  articles.map((article) => {
    axios.delete(`/articles/${article.key}`)
      .then(() => onSuccess(article))
      .catch(() => onFailure(article))
  })
}

const mapStateToProps = (state, prevState) => {
  const getKeysSelector = (state) =>
    state &&
    state.articles &&
    state.articles.map(
      ({ key }) => key
    )

  const getArticleKeysDiff = getDiff(getKeysSelector)

  const removedArticleKeys = getArticleKeysDiff(prevState, state).before

  return removedArticleKeys && {
    articles: prevState.articles.filter(
      (article) => removedArticleKeys.find((key) => key === article.key)
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  onSuccess: compose(dispatch, actions.deleteSuccess),
  onFailure: compose(dispatch, actions.deleteFailure)
})

export default connect(mapStateToProps, mapDispatchToProps)(syncDelete)
```

`redux-haiku` will make sure that the Subscriber functions (`syncNew`, `syncDelete`) _don't even get called_ if the `mapStateToProps` returns `undefined`. That, plus the fact that the state diff is done in a small fraction of the state, more or less guarantees that the resulting implementation will remain performant.

You can try it yourself in the `example` (TODO. Also provide some sort of live example with localStorage as side-effect instead of REST so it can be run completely local in the browser).

Finally, the integration as it is done in the store setup:

```javascript
import { createStore } from 'redux'
import reducer from './reducer'
import syncNew from './subscribers/syncNew'
import syncDelete from './subscribers/syncDelete'

const store = createStore(reducer, {})
syncNew(store)
syncDelete(store)
```

## Non-deterministic side-effects and alternative timelines

> NOTE: This is to be proven in a live example using REST operations with some sort of [chaos monkey](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey) automatic failure. Until I provide that proof, don't take my word for the stuff in this section, is just an idea of how it will work.

You might have realized already that _time traveling_ in the previous example is a little of a stretch: time travel is what we would get in the best case scenario, that is, if all operations work the same every single time. This might very well not be the case: the network connection could fail, the database might have a glitch, and then re running the so-called idempotent operations would lead to a different result.

Now, that in itself doesn't mean that `redux-haiku` fails at its promise. The reality is that time traveling, exactly like in movies, can take several forms:

- Fixed timeline: events happened in a certain way, and going back to the past and rewinding to the future results in the same events happening again. History is unchangeable.
- Multiple universes: events happened in a certain way in our current timeline, but by going back we don't really land into the same timeline and instead we create a new one. When we start going forward from there events can diverge from the original timeline and we can get an alternate universe where everything looks slightly dissimilar yet the overall structure is the same.

`redux-haiku` for non-deterministic side-effects falls under the _Multiple universes_ model. In the new timeline that we start when we go back we could get a failure when trying to create an article in the server, or a connection error when trying to delete: whatever the issue, the resulting actions triggered by the side-effects would look different. This is a shame, but we could, actually, mitigate this: we simply need to react to failures by retrying until we succeed. The point is to achieve something the server-side folks call "eventual consistency" in which when going back and replaying, the resulting application state (that is, not just the redux store state but also including side-effects) eventually achieves the same state as it was in the main timeline at that particular point in time. Granted, there might be some ripples happening in the way (and it might be completely impossible if the side-effect relied on a service that went offline) but the fact that it's even possible to recover the entire application state deriving from the data in the store points to the resilience of this architecture, not to mention the fact that the implementation remains declarative and simple to understand and predictable within the margin of trust in the necessary services for the side-effects to occur.

The key concept to enable this is that of _transition states_. Transition states are application states that given enough time will collapse into permanent ones. These states are artifacts of the side-effects unpredictability, and are not to be considered final states of a timeline. In the articles example, a transition state is one in which a `DELETE` operation failed to go through and the article is flagged as _removal pending_ in the state in some way and the syncDelete could schedule retrials until the removal operation is complete. Once that operation is complete, the final state is the same that would've been if the side-effect operation were deterministic. Thus the idea of replaying generating equivalent timelines that might have some differences while unfolding, but achieve consistency over time.

In other words,

> All parallel timelines will converge into the same state given enough time.

`redux-haiku` provides a flavor of time travel in which, as long as services don't go permanently offline, manages the rewriting of history by achieving eventual consistency between the different timelines. As non-deterministic side-effects go, the advantage of this approach should be glaring: it's resilient. Until consistency is achieved, the application will update itself and keep retrying, even if stopped completely and loaded again with the same state.

## Deterministic side-effects

That said, there are many categories of deterministic side-effects that in a similar manner to the DOM, can be done without risks of inconsistency in the resulting application state. For those cases, time travel is true and real: and one can wonder, if it's possible to implement them in a way that supports time traveling and makes the binding so simple, why doing them with some other strategy at all?

The most natural example is `localStorage`:

```javascript
import { connect } from 'redux-haiku'

const syncToLocalStorage = ({ articles }) => {
  localStorage.setItem('articles', JSON.stringify(articles))
}

const mapStateToProps = (state, prevState) => {
  // To be fair, there is no even need to use a diff in this example.
  // Since references are kept by Redux unless something inside the
  // collection changed, we can simply do a hard equality comparison
  return state.articles !== prevState.articles && {
    articles: state.articles
  }
}

export default connect(mapStateToProps)(syncToLocalStorage)
```

There.

## Not for synchronous control flow

A common pitfall when using Redux is how to handle operations that need to be done after several other operations happened. The temptation is to wait for a change in the state and react to that by immediately dispatching another action to reflect the fact that a new operation is being performed.

_This is an anti pattern_. The reality is that any operation that can be performed as a result of the state change in a subscriber can already be done in a reducer or in a selector instead. Since `redux-haiku` makes it really easy for this antipattern to emerge, it also comes bundled with a mechanism for preventing abuse of it. For example:

```javascript
// subscribers/changeToCompactViewWhenTooManyItems.js
import { connect } from 'redux-haiku'
import { compose } from 'redux'
import * as actions from '../actions'

const changeToCompactViewWhenTooManyItems = ({ items, onThresholdTrespassed }) => {
  if (items.length > 10) {
    onThresholdTrespassed(items.length)
  }
}

const mapStateToProps = (state) => state
const mapDispatchToProps = (dispatch) => ({
  onThresholdTrespassed: compose(dispatch, actions.changeToCompactView)
})

export connect(mapStateToProps, mapDispatchToProps)(changeToCompactViewWhenTooManyItems)
```

This will result in an exception! Namely:

```
Error: dispatching synchronously in a Subscriber is forbidden. Callbacks provided to Subscribers are meant to be used by asynchronous side effects as a way to trigger actions back into the store. Operations on the store to be done as a consequence of a particular state change should be done in reducers or selectors instead.
```

## One way data flow

`redux-haiku` models the data flow in three steps, exactly like Redux:

1. An Action is dispatched, that
2. …causes the global State to be updated and then
3. …some side-effect runs

This is the key principle that guides `redux-haiku`'s implementation: side-effects should happen only as a consequence of state update, not by intercepting particular actions. This way the unidirectional data flow is preserved and the architecture remains consistent and easy to grasp.

## Important: `getDiff`'s quirks and limitations

Now for a quick disclaimer:

> `getDiff` is not stable and it only works as expected under certain specific conditions. Its implementation is very likely to change.

Unlike `connect`, which is unlikely to change much in the future, `getDiff` is an experimental part of the API that is provided partially to illustrate the fact that there is nothing arcane about React's diff'ing feature and that you and anyone you know can implement their own diff'ing if need so. It's important to note then that `getDiff` has a couple of short comings that are unlikely to be addressed in the near future, mainly because of inherent limitations of JavaScript as a programming language.

Those limitations are:

- Object structures sent as argument to `getDiff` need to be acyclic–that is, no circular references should be present in it. This shouldn't be a problem when using with a Redux store state.
- Only JSON values are allowed. Again, not a problem when diff'ing a Redux state.
- Array structures are messy:
  - As of today, `object-difference` requires Arrays to have all of their elements to be objects, and all of those objects to contain a `key` property with a unique key, much like [React requires components in an Array to have a key](https://facebook.github.io/react/docs/multiple-components.html#dynamic-children). Scalar items with unique values could be supported in the future, but not yet.
  - Changes in the order of the elements of an Array will result in an empty diff. Ordering is not considered relevant for the current diff'ing algorithm: it might be added in the future, but reporting order changes is not the same as reporting modified items, so how exactly to represent the fact that the Array order changed is still to be defined.

More over, what is considered dirty and what is not might not be entirely straightforward. Let's take a look at an example to try to make things easier:

#### First example: Scalar values

For these, simple `===` comparison is used internally:

```javascript
import { getDiff } from 'redux-haiku'

// Let's get a diff'er that runs over the whole object to simplify
const selectAll = (x) => x
const getDiffForAll = getDiff(selectAll)

getDiffForAll(0, 0) // => { before: undefined, after: undefined }
getDiffForAll(0, 1) // => { before: 0, after: 1 }
getDiffForAll(undefined, 'hello') // => { before: undefined, after: 'hello' }
```

#### Ramping up complexity with object property comparisons

```javascript
import { getDiff } from 'redux-haiku'

// Let's get a diff'er that runs over the whole object to simplify
const selectAll = (x) => x
const getDiffForAll = getDiff(selectAll)

getDiffForAll(
  { value: 'initial' },
  { value: 'final' }
) // => { before: { value: 'initial' }, after: { value: 'final' } }

getDiffForAll(
  { value: 'same' },
  { value: 'same', added: 1 }
) // => { before: undefined, after: { added: 1 } }

getDiffForAll(
  { value: 'same', removed: 1 },
  { value: 'same', added: 2 }
) // => { before: { removed: 1 }, after: { added: 2 } }
```

As you can see, the `before` and `after` objects only show properties that are removed, added, or modified. In the second object example, nothing was removed or modified and consequently the `before` part of the diff is empty. Even when properties have been modified, only the relevant modified–_dirty_–properties are shown in the diff result.

#### Now let's go to the real tricky part, arrays

Again, arrays will only be compared if each element in them is an object and has a `key` property. Otherwise `object-difference` will simply fail (for now silently, that should probably be fixed).

```javascript
import { getDiff } from 'redux-haiku'

// Let's get a diff'er that runs over the whole object to simplify
const selectAll = (x) => x
const getDiffForAll = getDiff(selectAll)

getDiffForAll(
  [],
  [{ key: 'new' }]
) // => { before: undefined, after: [{ key: 'new' }] }

getDiffForAll(
  [{ key: 'removed' }, { key: 'same' }],
  [{ key: 'same' }]
) // => { before: [{ key: 'removed' }], after: undefined }
```

#### Putting it all together

```javascript
import { getDiff } from 'redux-haiku'

// Let's get a diff'er that runs over the whole object to simplify
const selectAll = (x) => x
const getDiffForAll = getDiff(selectAll)

getDiffForAll(
  {
    items: [
      {
        key: 'modified',
        value: 'initial',
        kept: 'same'
      }
    ],
    modified: {
      but: 'only in part',
      kept: 'same'
    }
  },

  {
    items: [
      {
        key: 'modified',
        value: 'final',
        kept: 'same'
      }
    ],
    modified: {
      different: 'only in part',
      kept: 'same'
    }
  }
)
/*
 * => {
 *  before: {
 *    items: [
 *       {
 *         value: 'initial'        
 *       }
 *     ],
 *     modified: {
 *       but: 'only in part'
 *     }
 *   },
 *   after: {
 *     items: [
 *       {
 *         value: 'final'        
 *       }
 *     ],
 *     modified: {
 *       different: 'only in part'
 *     }
 *   }
 * }
 */
```

Naturally, the recommendation is to run the diff only in the subset of the state that you care about: otherwise is far more likely that you are going to have to double check to find out if an object is present because it was modified/removed/added completely or if it's only there because one of its inner properties changed. It will also help with performance somewhat to run scoped diff's, since the way `redux-haiku` Subscribers are wired, the diff'ing part will be run each time there is an update in the store state.

### About `getDiff`s implementation and future

`getDiff` itself is a thin wrapper around [object-difference](https://github.com/xaviervia/object-difference), an experimental JavaScript library for implementing diff'ing between object structures. `getDiff` adds support for selectors to subset the state before the diff is run and normalizes the return value of `object-difference` to be more friendly to consumers, but other than that all limitations of the diff function are limitations of the `object-difference` library itself. Please refer there for further discussion.

The limitations and quirks described above are not considered to be hindrance right now, because at the end of the day `getDiff` is not a hard requirement for the Subscribers to work: it's just sugar to point out in the right direction regarding how the logic of the `mapStateToProps` should look like. Since the `mapStateToProps` in `connect` gets both the present and the previous state however, diff'ing can always be done manually and there is no specific need to rely on the `getDiff` function, which means that limitations in this function do not invalidate the idea in itself. As it's easy to see from some quirks in React, such as the need for a `key` in array structures, diff'ing is a hard problem in JavaScript, and only certain structures are diff'able.

## Installation

```
npm install --save redux-haiku
```

Requires a Redux compatible store to work.

## Testing

Clone this repo and

```
npm install
npm test
```

## Contributing

Right now the best possible way of contributing to this project is discussion. Go to the issues and write down your thoughts, unfiltered. The implementation to documentation ratio of the project is abysmal, and that is because there is much more to discuss regarding conventions and architecture ideas than code itself.

I'm particularly curious about what people think of the diff'ing feature. Using subscribers for side-effects is a rather common way of structuring a Redux application, but I think introducing diff'ing as a pre step to any subscription is the key concept in there.

That said, PR's are always welcome. Just hack ahead.

## Kudos

- …to the people of [`redux-saga`](https://github.com/yelouafi/redux-saga) for a nice original idea and an impressive implementation. The tongue-in-cheek reference to sagas in the introduction haiku is meant as a tribute and to give context to the name of `redux-haiku`. Thank you folks.
- …to [@pirelenito](https://github.com/pirelenito) for very useful feedback that helped in shaping this implementation.

## License

Copyright 2016 Fernando Vía Canel

ISC license.

See [LICENSE](LICENSE) attached.
