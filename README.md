# redux-haiku

> A saga is long and rambles on.
> A haiku goes to the point.
> Change!

**redux-haiku** is yet another way of managing side-effects in Redux: but don't be disheartened, because this time it's going to be so easy and natural that when you are done you're going to be left wondering why didn't we do it this way in the first place.

If you're using Redux, chances are that you are familiar with the **Containers** from `react-redux`: well, `redux-haiku` **Subscribers** work exactly like Containers, but allow you to operate with any type of side-effects, not just DOM related ones.

Be mindful though, redux-haiku Subscribers are a rather low level API for implementing bindings between Redux stores and diverse side-effects: it's very likely that your application should be consuming a binding library that uses redux-haiku internally, instead of setting up Subscribers with redux-haiku directly in the app.

Without further ado, take a look at how a Subscriber looks like:

```javascript
// subscribers/putInServer.js
import { connect, getDiff } from 'redux-haiku'
import * as actions from '../actions'
import { compose } from 'redux'
import axios from 'axios' // Simple XHR lib

const putInServer = ({ articles, onSuccess, onFailure }) => {
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

export default connect(mapStateToProps, mapDispatchToProps)(putInServer)
```

Looks familiar, right? That's exactly the point. What redux-haiku proposes is that any side-effect can be treated as a DOM side-effect: that is, it can be done as a result of a state change, which can be done by running a diff between the new and the old states on the part that the side-effect should care about, in the meanwhile reusing established patterns such as selectors, `mapStateToProps`, `mapDispatchToProps`, etc. redux-haiku

Now, the "aha" moment of Redux plus React is time traveling: that's when we all realized that Redux proved its metal. Time traveling is a way rule for identifying an architecture that makes for immutable, declarative apps. Time traveling is what redux-haiku promises, but not just for UI, but also for any other side-effects (that is, as long as the operations are idempotent, but that's a completely different concern).

Since we are using idempotent REST operations, let's assume that's the case. Then we can go full circle with another subscriber, this time for synchronizing the removal of articles:

```javascript
// subscribers/deleteInServer.js
import { connect, getDiff } from 'redux-haiku'
import * as actions from '../actions'
import { compose } from 'redux'
import axios from 'axios' // Simple XHR lib

const deleteInServer = ({ articles, onSuccess, onFailure }) => {
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

export default connect(mapStateToProps, mapDispatchToProps)(deleteInServer)
```

You can try it yourself in the `example` (TODO. Also provide some sort of live example with localStorage as side-effect instead of REST so it can be run completely local in the browser).

Finally, the integration as it's done in the store setup:

```javascript
import { createStore } from 'redux'
import reducer from './reducer'
import connectedPutInServer from './subscribers/putInServer'
import connectedDeleteInServer from './subscribers/deleteInServer'

const store = createStore(reducer, {})
connectedPutInServer(store)
connectedDeleteInServer(store)
```

## Non-deterministic side-effects and alternative timelines

Now, you might have realized that "time traveling" in the previous example is a little of a stretch: time travel is what we would get in the best case scenarios, that is, if all operation work perfectly the same every time.

Now, that doesn't mean that redux-haiku fails at it's promise. The reality is that time traveling, exactly like in the movies, can take many forms:

- Fixed timeline: events happened in a certain way, and going back to the past and rewinding to the future results in the same events happening again. The events are unchangeable.
- Multiple universes: events happened in a certain way in our timeline, but by going back we don't really land into the same timeline but instead we create a new one starting at the point that we rewind to. When we start going forward from there however, the events can diverge from the original timeline, and we can get an alternate universe where everything looks slightly dissimilar yet its structure is the same.

In the Multiple Universes timeline, we could get a failure when trying to create an article in the server, or a connection failure when trying to delete: whatever the issue, the resulting actions triggered by the side-effects would look different. This is a shame, but we could, actually, mitigate this: we simply need to react to failures by retrying until we succeed. The point is to achieve something the server-side folks call "eventual consistency" in which when going back and replaying, the resulting application state (that is, not just the redux store state but also including side-effects) eventually achieves the same state as it was in the main timeline at that particular point in time. Granted, there might be some ripples happening in the way (and it might be completely impossible if the side-effect relied on a service that went offline) but the fact that it's even possible to recover the entire application state deriving from the data in the store points to the resilience of this architecture, not to mention the fact that the implementation remains declarative and simple to understand and predictable within the margin of trust in the necessary services for the side-effects to occur.

> Oh, and a final note: feature-wise, this is super alpha, because the underlying diffing library `object-difference` is not stable at all yet. Other than that it should be bug free. Still, you're welcome to use it in production: after all, you are very likely already compiling stage-0 babel code, which is not even standard yet, you naughty naughty kid.
