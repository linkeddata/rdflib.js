import Node from './node-internal';

/**
* A type for values that serves as inputs
*/
export type ValueType = Node | Date | string | number | boolean | undefined;

export interface Bindings {
  [id: string]: Node;
}
