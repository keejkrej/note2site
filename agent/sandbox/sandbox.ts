import { defineSandbox } from "eve/sandbox";
import { justbash } from "eve/sandbox/just-bash";

export default defineSandbox({
  backend: justbash(),
  async bootstrap({ use }) {
    const sandbox = await use();
    await sandbox.run({
      command: "node --version && npm --version",
    });
  },
});
