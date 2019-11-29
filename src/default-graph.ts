'use strict'
import Node from './node-internal'
import { TermType } from "./types";

/** The RDF default graph */
export default class DefaultGraph extends Node {
  static termType = TermType.DefaultGraph;

  termType = TermType.DefaultGraph;

  constructor () {
    super('')
  }

  toCanonical () {
    return this.value
  }
}
