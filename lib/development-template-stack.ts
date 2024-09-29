import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class DevelopmentTemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "SkillsTable", {
      partitionKey: { name: "JobId", type: dynamodb.AttributeType.STRING },
      tableName: "JobSkills",
    });

    const jobDescriptionLambda = new lambda_nodejs.NodejsFunction(
      this,
      "JobDescriptionAnalyzerLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "../functions/jobDescriptionAnalyzer/index.ts",
        ),
        environment: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
          TABLE_NAME: table.tableName,
        },
      },
    );

    table.grantReadWriteData(jobDescriptionLambda);

    const api = new apigateway.RestApi(this, "JobDescriptionAnalyzerAPI", {
      restApiName: "Job Description Analyzer Service",
      description:
        "This API analyzes job descriptions to extract required skills and proficiencies.",
    });

    const jobDescriptionResource = api.root.addResource("analyze");
    jobDescriptionResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(jobDescriptionLambda),
    );

    new cdk.CfnOutput(this, "API URL", {
      value: api.url,
    });
  }
}
