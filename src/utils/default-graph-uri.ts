// Prevents circular dependencies between data-factory-internal and statement

import NamedNode from '../named-node'

export const defaultGraphURI = 'chrome:theSession'
export const defaultGraphNode = new NamedNode(defaultGraphURI)
