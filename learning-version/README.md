# Job Application Tracker

A learning project that grows from a browser-only CRUD application into a serverless AWS application.

## Architecture

```text
Browser -> API Gateway -> Lambda -> DynamoDB
```

## Run the frontend locally

From the repository root:

```bash
python3 -m http.server 8080 --directory learning-version
```

Then open <http://localhost:8080>.

## Validate and deploy the backend

From `learning-version`:

```bash
sam validate --lint --region us-east-1
sam build
sam deploy
```

The deployment uses the existing `job-tracker-dev` stack in `us-east-1`.

