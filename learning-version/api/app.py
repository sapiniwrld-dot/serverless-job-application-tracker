import json
import os
import uuid
from datetime import datetime, timezone

import boto3


table = boto3.resource("dynamodb").Table(
    os.environ["TABLE_NAME"]
)


def api_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": "*"
        },
        "body": json.dumps(body)
    }


def create_application(event):
    try:
        request_body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return api_response(
            400,
            {"message": "Request body must be valid JSON"}
        )

    company = str(request_body.get("company", "")).strip()
    role = str(request_body.get("role", "")).strip()

    if not company or not role:
        return api_response(
            400,
            {"message": "Company and role are required"}
        )

    application = {
        "applicationId": str(uuid.uuid4()),
        "company": company,
        "role": role,
        "status": request_body.get("status", "Applied"),
        "dateApplied": request_body.get("dateApplied", ""),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }

    table.put_item(Item=application)
    return api_response(201, application)


def list_applications():
    result = table.scan()
    applications = result.get("Items", [])
    applications.sort(
        key=lambda application: application.get("createdAt", ""),
        reverse=True
    )
    return api_response(200, {"applications": applications})


def delete_application(application_id):
    table.delete_item(Key={"applicationId": application_id})
    return api_response(200, {"message": "Application deleted"})


def handler(event, context):
    http_context = (
        event.get("requestContext", {})
        .get("http", {})
    )
    method = http_context.get("method", "GET")
    path = http_context.get("path", "/health")
    application_id = (
        event.get("pathParameters") or {}
    ).get("id")

    if path.endswith("/health"):
        return api_response(
            200,
            {"message": "Job Tracker API is running"}
        )

    if path.endswith("/applications") and method == "GET":
        return list_applications()

    if path.endswith("/applications") and method == "POST":
        return create_application(event)

    if method == "DELETE" and application_id:
        return delete_application(application_id)

    return api_response(404, {"message": "Route not found"})

