import { DynamoDB } from "aws-sdk";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import OpenAI from "openai";

const dynamoDb = new DynamoDB.DocumentClient();
const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received event:", JSON.stringify(event));

  try {
    const jobDescription = event.body;

    console.log("Received job description:", jobDescription);

    if (!jobDescription) {
      throw new Error("JobDescription is required.");
    }

    console.log("Calling OpenAI API...");
    const openAiResponse = await openAi.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts skills from job descriptions.",
        },
        {
          role: "user",
          content: `Extract required skills, their importance (High, Medium, Low), and proficiency (Advanced, Intermediate, Novice) from the following job description: ${jobDescription}`,
        },
      ],
      max_tokens: 100,
    });

    console.log("OpenAI Response:", JSON.stringify(openAiResponse));

    const message = openAiResponse.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new Error("No skills extracted from OpenAI response.");
    }

    const params = {
      TableName: process.env.TABLE_NAME!,
      Item: {
        JobId: new Date().toISOString(),
        Skills: message,
      },
    };

    await dynamoDb.put(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify(message),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong" }),
    };
  }
};
