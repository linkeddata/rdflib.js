// Prevents circular dependencies between data-factory-internal and statement
import NamedNode from '../named-node';
export var defaultGraphURI = 'chrome:theSession';
export var defaultGraphNode = new NamedNode(defaultGraphURI);