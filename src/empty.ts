'use strict'
import Node from './node-internal'
import { TermType } from "./types";

/**
 * Singleton subclass of an empty Collection.
 */
export default class Empty extends Node {
  static termType = TermType.Empty

  termType = TermType.Empty

  constructor () {
    super('')
  }

  toString () {
    return '()'
  }
}
