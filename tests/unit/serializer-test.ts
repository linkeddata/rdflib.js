import { expect } from "chai";
import { graph, Serializer, sym } from "../../src/index";

describe("Serializer", () => {
	describe("can make up prefixes", () => {
		const serializer = Serializer(graph());
		afterEach(() => {
			serializer.prefixes = [];
			serializer.namespaces = [];
		});

		it("with a simple URI", () => {
			const prefix = serializer.makeUpPrefix("http://example.org");
			expect(prefix).to.equal("exa");
		});

		it("with a URI with a trailing slash", () => {
			const prefix = serializer.makeUpPrefix("http://example.org/");
			expect(prefix).to.equal("exa");
		});

		it("with a URI ending with a #", () => {
			const prefix = serializer.makeUpPrefix("http://example.org#");
			expect(prefix).to.equal("exa");
		});

		it("with a URI with multiple slashes", () => {
			const prefix = serializer.makeUpPrefix(
				"http://www.w3.org/ns/shacl"
			);
			expect(prefix).to.equal("shacl");
		});

		it("with a URI with multiple slashes and a #", () => {
			const prefix = serializer.makeUpPrefix(
				"http://www.w3.org/ns/shacl#"
			);
			expect(prefix).to.equal("shacl");
		});

		it("with a URI with multiple slashes and a #/", () => {
			const prefix = serializer.makeUpPrefix(
				"http://www.w3.org/ns/shacl#/"
			);
			expect(prefix).to.equal("shacl");
		});

		it("with a URI starting with 'a'", () => {
			const prefix = serializer.makeUpPrefix("http://aschema.org");
			expect(prefix).to.equal("asc");
		});
	});

	describe("with the 'k' (keywords) flag", () => {
		let serializer;
		beforeEach(() => {
			serializer = Serializer(graph());
			serializer.setFlags("k");
			serializer.defaultNamespace = "http://example.org/ns#";
		});

		it("serializes a default-namespace symbol as a bare word", () => {
			const term = serializer.symbolToN3(
				sym("http://example.org/ns#foo")
			);
			expect(term).to.equal("foo");
		});

		it("keeps the colon for keywords such as 'a'", () => {
			const term = serializer.symbolToN3(sym("http://example.org/ns#a"));
			expect(term).to.equal(":a");
		});
	});
});
