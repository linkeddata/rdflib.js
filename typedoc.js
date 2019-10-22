module.exports = {
  src: ['./src'],
  mode: "file",
  out: "doc",
  tsconfig: "tsconfig.json",
  theme: "default",
  hideGenerator: true,
  ignoreCompilerErrors: true,
  excludePrivate: true,
  excludeNotExported: "true",
  target: "ES6",
  moduleResolution: "node",
  preserveConstEnums: "true",
  stripInternal: "true",
  suppressExcessPropertyErrors: "true",
  suppressImplicitAnyIndexErrors: "true",
  module: "commonjs"
}
