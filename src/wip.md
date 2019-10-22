Builds upon the approved #363 PR for [typescript migration](https://github.com/linkeddata/rdflib.js/issues/355):

## Changes included in PR #363

- Converted some of the most fundamental classes to typescript, including `Node`, `Literal`, `BlankNode`, `NamedNode`, `Collection`, `Statement`.
- Introduced a `.types` file for shared types.
- Included a temporary `types-temp.ts` file in project root as a reference file for documentation and keeping track of the ts migration process.
- The `.isVar` method is set to boolean values, instead of `0` or `1`. This seemed reasonable, as it's only used for boolean type checks, and the existing types already define it as a boolean value. Timbl confirmed that `isVar` is only used for boolean operations.
- JSDoc is replaced with Typedoc. Combined with types and comments from `@types/rdflib`, this makes the documentation far more complete.
- I used many of the types and comments from `@types/rdflib` by [Cénotélie](https://github.com/cenotelie/). Added credits in `package.json`, discussed this with Cénotélie.

## New changes

- Migrated `formula`, `variable`, `store`, `update-manager`, `data-factory`, `default-graph`, `namespace`, `parse`,`serialize`, `parse`, `uri` and `utils` tot ts.
- Added `fork-ts-checker-webpack-plugin`, which enables errors in the log when ts errors occur.
- Added and implemented RDF/JS Taskforce (TF) types, included these in the `types.ts` file. I tried implementing the TF types in the major classes, but some of the incompatibilities make it difficult. Many available methods on rdfjs instances (e.g. `.toNt()` in NamedNode), are missing in TF classes. To improve TF comatibility, we should minimize using rdflib specific functions. This would for example enable using Forumla methods on RDFExt nodes. We should use the Taskforce types (TFTerm, TFQuad) as much as possible, instead of rdflib types (Node, Statement).
- Added typeguards, e.g. `isTFNamedNode` and `isTFPredicate` in `Utils`, and used these at various locations.
- Use enums for `termType` and `contentType`, without breaking compatibility with regular strings.
- `Formula` Constructor arguments are optional - since some functions initialize empty Formulas.
- In `Formula.fromNT()` `return this.literal(str, lang || dt)` seemed wrong, converted it to
- The various `fromValue` methods conflict with the base Node class, type wise. Since they don't use `this`, I feel like they should be converted to functions.

## Compatibility with RDFJS taskforce and external datafactories

- Variables (from rdfjs taskforce) make typings a lot more complex (many methods would require explicit type checks, e.g. you can't serialize a variable to N-Triples), so I disabled them.
- Switched internal calls from `sameTerm` to `equals` in order to comply to TF spec, so that these functions also work with external datafactories. Alias still exists, so nothing changes externally.
- Switched internal calls from `.why` to `graph`. Alias still exists, so nothing changes externally.
- Calls to `kb.sym` have been replaced with `kb.rdfFactory.namedNode`, which makes all these functions more compatible with external datafactories. Added a deprecation warning to `.sym`.

## Minor fixes

- Removed the last conditional of `Formula.holds()`, since it did not make sense
- Removed some unreachable code, unused variables and functions that didn't do anything such as `Node.substitute()`.
- Removed the `justOne` argument from `formula.statementsMatching`, since it was unused.
- The `uri.document` function called `.uri` on a string, I removed that.
- Transformed inline comments to JSDoc, moved them to type declarations instead of constructor.
- Some types are set to any, because I didn't fully understand them. I've added TODO comments for these.
- Removed the fourth argument from the `parser.parse` function in `fetcher.parse`, since the function only takes three.
- Removed the `response` argument from `fetcher.parse`, `XHTMLHandler.parse`, `RDFXMLHander.parse`, `XMLHandler`, since it was not used.
- `Fetcher.failfetch` added strings as objects to the store. Changed that to literals.
- Internal calls to `NamedNode.uri` are changed to `.value` to comply with TF spec. This enables these functions to work with external datafactories.
- Removed unused second argument from `Fetcher.cleanupFetchRequest`
- Created one huge `Options` type for Fetcher. Not sure if this is the way to go.
- In `Node.toJS`, the boolean only returned true if the `xsd:boolean` value is `'1'`, now it it should also work for `'true'`.
- Converted `kb.add(someString)` to `kb.add(new Namednode(somestring))` to enhance compatibility with other datafactories. This happens in `Fetcher` and
- `Fetcher.refreshIfExpired` passed an array of headers, but it needs only one string.
- `Fethcer` uses `Headers` a lot. I've changed empty objects to empty `new Headers` instances, which enhances compatibility with default `Fetch` behavior.
- `Serializer.tripleCallback` had an unused third argument.
- `UpdateManager.update` checked an undefined `secondTry` variable. Since later in the same function, `.update` is called with a 4th argument, I assume this is `secondTry`. I've added it as an optional argument. Perhaps this is
- `Formula.add()` now uses `this.rdfFactory.defaultGraph` instead of the non-existent `this.defaultGraph`
- `IndexedFormula.replaceWith` now passes a Node instead of a string to `.add` in the `if (big.value)` block

## Possible bugs discovered, which are not fixed by this PR

- `Formula.substitute` uses `this.add(Statments[])`, which will crash. I think it should be removed, since `IndexedFormula.substitute` is used all the time anyway.
- The `Formula.serialize` function calls `serialize.ts` with only one argument, so without a store. I think this will crash every time. Also`Formula.serialize` uses `this.namespaces`, but this is only defined in `IndexedFormula`. Is it rotten code and should it be removed?
- `IndexedFormula.add()` accepts many types of inputs, but this will lead to invalid statements (e.g. a Literal as a Subject). I suggest we make this more strict and throw more errors on wrong inputs. Relates to #362. We could still make the allowed inputs bigger by allowing other types with some explicit behavior, e.g. in subject arguments, create `NamedNodes` from `URL` objects and `strings` that look like URLs . In any case, I thinkg the `Node.fromValue` behavior is too unpredictable for `store.add`. For now, I've updated the docs to match its behavior.
- The types for `Node.fromValue` and `Literal.fromValue` show how unpredictable these methods are. I suggest we make them more strict (also relates to #362), so they either return a `TFTerm` (`node`) or throw an error - they should not return `undefined` or `null`. Also, I think they should be converted to functions in `Utils`: this would fix the circular dependency issue (why we need `node_internal`) and it would fix the type issues in `Literal.fromValue` (which tends to give issues since it's signature does not correctly extend from `Node.fromValue`)
- In `Fetcher.addtype`, the final logic will allways return `true`, since `redirection` is a `NamedNode`. Should it call `.value`?
- Various `Hanlder.parse()` functions in `Fetcher` return either a `Response` or a `Promise<Error>`. This seems like weird behavior - should it not always return an array?
- The `defaultGraph` iri is set to `chrome:theSession`, but this errors in Firefox. I suggest we change it to something else. See #370.
- The `Parse.executeErrorCallback` conditional logic is always `true`.
- I've added many `// @ts-ignore` comments. Ideally, these should be resolved by fixing the underlying type issues.
- `UpdateManager.update_statement` seems to refer to the wrong `this`. It calls `this.anonimize`, but it is not available in that scope.
- `UpdateManager.updateLocalFile` uses `Component`, but this is not defined anywhere. Is this deprecated?
- `Data-factory-internal.id()` returns `string | undefined`, I feel like undefined should not be possible - it should throw an error. This would resolve the type incompatibility on line 146.
- `IndexedFormula.copy` runs `.copy` on a Collection, but that method is not available there.
- `IndexedFormula.predicateCallback` is checked, but never used in this codebase.


## Other things I noticed

- Literals can apparently be `null` or `undefined`, when nodes are created using the `.fromValue` method. This causes faulty behavior. This happens in the `new Statement()` constructor as well. See #362.
- The `IndexedFormula.add()` method has logic for Statement array inputs and store inputs, but this behavior is not documented. It also refers to `this.fetcher` and `this.defaultGraph`, which both should not be available. I've added types that accept these arrays.
- The filenames of major classes differ from their default exports, e.g. `store.ts` is called `IndexedFormula`.
- Aliases (e.g. `IndexedFormula.match` for `IndexefFormula.statementsMatching`) introduce complexity, documentation and type duplication. I suggest adding deprecation warnings.
- The various calling methods of `Fetcher.nowOrWhenFetched` are quite dynamic. A simpler, stricter input type might be preferable.
- The Variable type (or `TFVariable`) really messes with some assumptions. I feel like they should not be valid in regular quads, since it's impossible to serialize them decently. If I'd add it to the accepted types, we'd require a lot of typeguards in functions.
- `Fetcher` `StatusValues` can be many types in RDFlib: string, number, true, undefined... This breaks compatibility with extending `Response` types, since these only use numbers. I feel we should only use the `499` browser error and add the text message to the `requestbody`. I've created a type for the internal `InternalResponse`; it shows how it differs from a regular `Response`. The `.responseText` property, for example, is used frequently in Fetcher, but
- The `IndexedFormula` and `Formula` methods have incompatible types, such as in `compareTerm`, `variable` and `add`. I've added `//@ts-ignore` lines with comments.
- The fourth `reponse` argument in `.parse()` methods in `Handler` classes was unused (except in N3Handler), so I removed it everywhere it was unused.
- `Serializer`'s fourth `options` argument is undocumented, and I couldn't find out how it worked.
- `Fetcher` `saveResponseMetadata` creates literals
- Many functions in `Fetcher` assume that specific `Opts` are defined. I've included all these in a single `Options` type and added documentation for the props I understood. I've also created an `AutoInitOptions` type, which sets auto-initialized. I extended Options in each function where specific opts seemed to be required. I'm not entirely confident about the types I've set. I feel like the truly required items should never be `Opts`, since they aren't optional. Refactoring this requires a seperate PR.
- `Fetcher.load` allows arrays as inputs. This causes the output types to be more unpredictable. `Promise<Result> | Result[]`. I suggest splitting this in two functions, e.g. add `loadMany`
- `Utils.callbackify` seems to be used only in `Fetcher`.
- `UpdateManager.editable` has a confusing return type (`string | boolean | undefined`). I suggest we refactor it to always return one of multiple pre-defined strings,.
- The `optional` argument in `formula.js` does not seem to be documented, used or tested - should it be removed?

## Need review

- Some of the `Formula` and `IndexedFormula` functions (e.g. `anyStatementMatching`) might have too strict types - perhaps Collections are allowed in some of them.
- `IndexedFormula.declareExistential` & `newExistential` have different assumptions on types - should they be blanknodes or namednodes?
- `IndexedFormula.check` passes a single statement to `checkStatementList`, which expects an array
- I've added many type assertions (e.g. `as TFObject`), but Ideally, these do not exist. Ultimately, these should be replaced by TypeGuards that work on runtime/
- The `data-factory-types` are quite complex. This is a result of the differences between the RDF//JS Taskforce spec and rdflib itself. Perhaps there is an easier / cleaner way to setup the types (without heavy use of generics), but I'm afraid I can't think of one.

## Some thoughts on simplifying language

Getting started with Linked Data or RDF can be difficult, since it introduces quite a few new concepts.
Since this library is powerful and generic, it might be one of the first and most important RDF tools that a developer will use.
Therefore, we should try to use consistent langauge and keep synonyms to a minimum.

- The name `Node` and `Term` seem to refer to the same concept. Both are used in this repo. I think Term is slightly more suited, partially because it complies to the TF spec, but also because it seems more sementically correct. A `Literal`, for example, is not really a node in the mathematical sense, it's more of an edge, since it cannot connect to other nodes.
- `Statement`, `Triple` and `Quad` refer to the same concept, at least technically. Maybe we could pick one. I suggest `Statement`, because it covers both triples and quads.
- The concept `graph` is referred to as `why`, `doc` and `graph` in the code and API. I think this might be confusing - should we just call it `graph` everywhere?
- the `IndexedFormula` default export name is different from the `store` filename. It might be easier to just call it `store` everywhere, including where it's called `kb`.

## Probably OK, but I don't get it:

- I'm a bit embarassed about this, but even after rewriting so much of the code I still don't understand all methods. E.g. `Forumla.transitiveClosure()`
