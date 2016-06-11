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

> Oh, and a final note: feature-wise, this is super alpha, because the underlying diffing library `object-difference` is not stable at all yet. Other than that it should be bug free. Still, you're welcome to use it in production: after all, you are very likely already compiling stage-0 babel code, which is not even standard yet, you naughty naughty kid.
