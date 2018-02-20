/**
 * The QuerySource object stores a set of listeners and a set of queries.
 * It keeps the listeners aware of those queries that the source currently
 * contains, and it is then up to the listeners to decide what to do with
 * those queries in terms of displays.
 * Not used 2010-08 -- TimBL
 * @class QuerySource
 * @author jambo
 */
module.exports = QuerySource

var optionalSubqueriesIndex = [];

function QuerySource () {
  /**
   * stores all of the queries currently held by this source,
   * indexed by ID number.
   */
  this.queries = []
  /**
   * stores the listeners for a query object.
   * @see TabbedContainer
   */
  this.listeners = []

  /**
   * add a Query object to the query source--It will be given an ID number
   * and a name, if it doesn't already have one. This subsequently adds the
   * query to all of the listeners the QuerySource knows about.
   */
  this.addQuery = function (q) {
    var i
    if (q.name === null || q.name === '') {
      q.name = 'Query #' + (this.queries.length + 1)
    }
    q.id = this.queries.length
    this.queries.push(q)
    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] !== null) {
        this.listeners[i].addQuery(q)
      }
    }
  }

  /**
   * Remove a Query object from the source.  Tells all listeners to also
   * remove the query.
   */
  this.removeQuery = function (q) {
    var i
    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] !== null) {
        this.listeners[i].removeQuery(q)
      }
    }
    if (this.queries[q.id] !== null) {
      delete this.queries[q.id]
    }
  }

  /**
   * adds a "Listener" to this QuerySource - that is, an object
   * which is capable of both adding and removing queries.
   * Currently, only the TabbedContainer class is added.
   * also puts all current queries into the listener to be used.
   */
  this.addListener = function (listener) {
    var i
    this.listeners.push(listener)
    for (i = 0; i < this.queries.length; i++) {
      if (this.queries[i] !== null) {
        listener.addQuery(this.queries[i])
      }
    }
  }
  /**
   * removes listener from the array of listeners, if it exists! Also takes
   * all of the queries from this source out of the listener.
   */
  this.removeListener = function (listener) {
    var i
    for (i = 0; i < this.queries.length; i++) {
      if (this.queries[i] !== null) {
        listener.removeQuery(this.queries[i])
      }
    }

    for (i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] === listener) {
        delete this.listeners[i]
      }
    }
  }
}
