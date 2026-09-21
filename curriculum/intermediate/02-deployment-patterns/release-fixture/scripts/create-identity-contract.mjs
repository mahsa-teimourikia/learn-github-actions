import { mkdirSync, writeFileSync } from "node:fs";
import { createOidcTrustContract } from "../src/release-lifecycle.mjs";

const contract = createOidcTrustContract({
  repositoryId: process.env.REPOSITORY_ID ?? "123456",
  repositoryOwnerId: process.env.REPOSITORY_OWNER_ID ?? "654321",
  environment: process.env.TARGET_ENVIRONMENT ?? "lab-production",
  jobWorkflowRef: process.env.JOB_WORKFLOW_REF ?? "oneplusi/platform/.github/workflows/deploy.yml@refs/heads/main",
  audience: process.env.OIDC_AUDIENCE ?? "https://cloud.example.com",
});
mkdirSync("reports", { recursive: true });
writeFileSync("reports/oidc-trust-contract.json", `${JSON.stringify(contract, null, 2)}\n`);
console.log(JSON.stringify(contract));
