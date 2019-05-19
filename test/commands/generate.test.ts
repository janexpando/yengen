import { expect, test } from "@oclif/test";

describe("generate", () => {
  test
    .stdout()
    .command(["generate", "test/fixtures/openapi_1.json"])
    .it("runs hello", ctx => {

      expect(ctx.stdout).to.be.ok;
    });
});
