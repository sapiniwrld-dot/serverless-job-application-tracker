# Serverless Job Application Tracker

A full-stack job application tracker with secure user authentication and a serverless AWS backend.

## Features

- Sign up and sign in with Amazon Cognito
- Authorization Code flow with PKCE
- JWT-protected API routes
- Private application data for each user
- Create, view, update, and delete job applications
- Store application data in Amazon DynamoDB
- Deploy infrastructure with AWS SAM and CloudFormation

## Architecture

```text
Browser
   |
   |-- Sign in --> Amazon Cognito
   |
   |-- JWT --> Amazon API Gateway
                    |
                 AWS Lambda
                    |
              Amazon DynamoDB
```

## Technologies

- HTML, CSS, and JavaScript
- Python
- Amazon Cognito
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- AWS SAM
- AWS CloudFormation
- Git and GitHub

## Deploy the AWS backend

```bash
cd learning-version
sam validate --lint --region us-east-1
sam build
sam deploy --guided
```

## Configure the frontend

Copy the example configuration:

```bash
cp learning-version/config.example.js learning-version/config.js
```

Open `learning-version/config.js` and replace the placeholders with the outputs from your deployed CloudFormation stack.

## Run locally

From the repository root:

```bash
python3 -m http.server 8080 --directory learning-version
```

Then visit <http://localhost:8080>.

## Security

- API routes require a valid Cognito JWT.
- Unauthenticated API requests receive an HTTP 401 response.
- Each DynamoDB record is associated with the signed-in user's Cognito ID.
- Users can only view, update, or delete their own records.
- The live `config.js` file is excluded from Git.
- No passwords or client secrets are stored in the repository.

## Verified functionality

- Authenticated create, read, update, and delete operations
- Data persistence after refreshing
- Data hidden after signing out
- Data restored after signing back in
- Unauthenticated API access rejected
