import { defineSandbox } from "eve/sandbox";
import { defaultBackend } from "eve/sandbox";

export default defineSandbox({
  backend: defaultBackend({
    vercel: {
      runtime: "node24",
      resources: { vcpus: 2 },
    },
    docker: {
      image: "ghcr.io/vercel/eve:latest",
    },
  }),
  revalidationKey: () => "note2site-v1",
  async bootstrap({ use }) {
    const sandbox = await use();
    await sandbox.run({
      command: "node --version && npm --version",
    });
  },
});
