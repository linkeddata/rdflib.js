import { expect } from "chai";
import { graph, Serializer } from "../../src/index";

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
});
