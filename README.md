# Serverless Job Application Tracker

A full-stack job application tracker built with vanilla JavaScript and a serverless AWS backend.

## Features

- Create and view job applications
- Update application statuses
- Delete individual applications
- Store data permanently in Amazon DynamoDB
- Deploy infrastructure with AWS SAM and CloudFormation

## Architecture

```text
Browser
   |
API Gateway
   |
AWS Lambda
   |
Amazon DynamoDB
```

## Technologies

- HTML, CSS, and JavaScript
- Python
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- AWS SAM
- AWS CloudFormation
- Git and GitHub

## Run locally

Create your local configuration:

```bash
cp learning-version/config.example.js learning-version/config.js
```

Open `learning-version/config.js` and replace the example address with your deployed API address.

Start the frontend:

```bash
python3 -m http.server 8080 --directory learning-version
```

Then visit <http://localhost:8080>.

## Deploy the AWS backend

```bash
cd learning-version
sam validate --lint --region us-east-1
sam build
sam deploy --guided
```

## Security

The live `config.js` file is excluded from Git. The included `config.example.js` contains only a placeholder. Authentication should be added before hosting the application as a public live demo.