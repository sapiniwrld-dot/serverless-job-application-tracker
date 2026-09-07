import json
import os
import uuid
from datetime import datetime, timezone

import boto3  # type: ignore
from botocore.exceptions import ClientError  # type: ignore


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

def get_user_id(event):
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
        .get("sub")
    )
def create_application(event, user_id):
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
        "userId": user_id,
        "applicationId": str(uuid.uuid4()),
        "company": company,
        "role": role,
        "status": request_body.get("status", "Applied"),
        "dateApplied": request_body.get("dateApplied", ""),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }

    table.put_item(Item=application)
    return api_response(201, application)


def list_applications(user_id):
    result = table.scan(
        FilterExpression="#user_id = :user_id",
        ExpressionAttributeNames={
            "#user_id": "userId"
        },
        ExpressionAttributeValues={
            ":user_id": user_id
        }
    )

    applications = result.get("Items", [])
    applications.sort(
        key=lambda application: application.get("createdAt", ""),
        reverse=True
    )
    return api_response(200, {"applications": applications})


def delete_application(application_id, user_id):
    try:
        table.delete_item(
            Key={
                "applicationId": application_id
            },
            ConditionExpression="#user_id = :user_id",
            ExpressionAttributeNames={
                "#user_id": "userId"
            },
            ExpressionAttributeValues={
                ":user_id": user_id
            }
        )
    except ClientError as error:
        error_code = error.response["Error"]["Code"]

        if error_code == "ConditionalCheckFailedException":
            return api_response(
                404,
                {"message": "Application not found"}
            )

        raise

    return api_response(
        200,
        {"message": "Application deleted"}
    )


def update_application(event, application_id, user_id):
    try:
        request_body = json.loads(
            event.get("body") or "{}"
        )
    except json.JSONDecodeError:
        return api_response(
            400,
            {"message": "Request body must be valid JSON"}
        )

    new_status = str(
        request_body.get("status", "")
    ).strip()

    allowed_statuses = [
        "Saved",
        "Applied",
        "Interview",
        "Offer",
        "Rejected"
    ]

    if new_status not in allowed_statuses:
        return api_response(
            400,
            {"message": "Please provide a valid status"}
        )

    try:
        result = table.update_item(
            Key={
                "applicationId": application_id
            },
            UpdateExpression="SET #status = :status",
            ConditionExpression="#user_id = :user_id",
            ExpressionAttributeNames={
                "#status": "status",
                "#user_id": "userId"
            },
            ExpressionAttributeValues={
                ":status": new_status,
                ":user_id": user_id
            },
            ReturnValues="ALL_NEW"
        )
    except ClientError as error:
        error_code = error.response["Error"]["Code"]

        if error_code == "ConditionalCheckFailedException":
            return api_response(
                404,
                {"message": "Application not found"}
            )

        raise

    return api_response(200, result["Attributes"])


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
    user_id = get_user_id(event)

    if path.endswith("/health"):
        return api_response(
            200,
            {"message": "Job Tracker API is running"}
        )

    if not user_id:
        return api_response(
            401,
            {"message": "Unauthorized"}
        )

    if path.endswith("/applications") and method == "GET":
        return list_applications(user_id)

    if path.endswith("/applications") and method == "POST":
        return create_application(event, user_id)

    if method == "PUT" and application_id:
        return update_application(event, application_id, user_id)

    if method == "DELETE" and application_id:
        return delete_application(application_id, user_id)

    return api_response(404, {"message": "Route not found"})

