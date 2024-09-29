import * as cdk from "aws-cdk-lib";
import { DevelopmentTemplateStack } from "../lib/development-template-stack";

const app = new cdk.App();
new DevelopmentTemplateStack(app, "JobDescriptionAnalyzerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    app: "JobDescriptionAnalyzer",
  },
});
