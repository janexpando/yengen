import { expect, test } from "@oclif/test";

describe("generate", () => {
  test
    .stdout()
    .command(["generate", "test/fixtures/codegen-configs/openapi.ts"])
    .it("runs hello", ctx => {
      expect(ctx.stdout).to.be.ok;
    });
});
