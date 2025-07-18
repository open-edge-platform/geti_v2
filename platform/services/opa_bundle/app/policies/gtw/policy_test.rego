# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package istio.authz

import future.keywords
import future.keywords.every
import input.attributes.request.http as http_request
import input.parsed_path
import input.parsed_query

test_health_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
            "method": "GET",
            "path": "/health/",
        }}},
        "parsed_path": [
            "health",
            "",
        ],
    }
}

test_service_account_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
            "path": "/api/v1/service_accounts/",
        }}},
        "parsed_path": ["api", "v1", "service_accounts"],
    }
}

test_user_active_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/active",
        }}},
        "parsed_path": ["api", "v1", "users","active"],
    }
}

test_user_workflow_id_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/workflow_id",
        }}},
        "parsed_path": ["api", "v1", "users","workflow_id"],
    }
}

test_user_with_anom_route_login_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/login",
        }}},
        "parsed_path": ["api", "v1", "users","login"],
    }
}

test_user_with_anom_route_request_password_reset_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/request_password_reset",
        }}},
        "parsed_path": ["api", "v1", "users","request_password_reset"],
    }
}

test_user_with_anom_route_reset_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/reset_password",
        }}},
        "parsed_path": ["api", "v1", "users","reset_password"],
    }
}

test_user_with_anom_route_confirm_registration_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/confirm_registration",
        }}},
        "parsed_path": ["api", "v1", "users","confirm_registration"],
    }
}

test_user_with_anom_route_access_token_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/service_accounts/access_token",
        }}},
        "parsed_path": ["api", "v1", "service_accounts","access_token"],
    }
}

test_user_confirm_with_anom_route_sign_up_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/registration/sign-up",
        }}},
        "parsed_path": ["api", "v1", "users","registration", "sign-up"],
    }
}

test_user_confirm_with_anom_route_reset_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/registration/reset-password",
        }}},
        "parsed_path": ["api", "v1", "users","registration", "reset-password"],
    }
}

test_user_confirm_with_anom_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/service_accounts/access_token",
        }}},
        "parsed_path": ["api", "v1", "users", "get_user_id"],
    }
}

test_update_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "POST",
            "path": "/api/v1/users/owner/update_password",
        }}},
        "parsed_path": ["api", "v1", "users", "owner", "update_password"],
    }
    with check_authorization as true
    with spicedb_key as "key"
}

test_update_password_admin_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "POST",
            "path": "/api/v1/users/owner/update_password",
        }}},
        "parsed_path": ["api", "v1", "users", "owner", "update_password"],
    }
    with check_authorization as true
    with spicedb_key as "key"
}

test_update_password_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJub25lIn0.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoidWlkQGV4YW1wbGUub3JnIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibm90IG93bmVyIn0."},
        	"method": "POST",
            "path": "/api/v1/users/owner/update_password",
        }}},
        "parsed_path": ["api", "v1", "users", "owner", "update_password"],
    }
}

test_logs_admin_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "GET",
            "path": "/api/v1/logs",
        }}},
        "parsed_path": ["api", "v1", "logs"],
    }
    with check_authorization as true
    with spicedb_key as "key"
    with is_environment_on_prem as true
    with does_user_have_any_admin_role as true
}

test_logs_not_admin_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "GET",
            "path": "/api/v1/logs",
        }}},
        "parsed_path": ["api", "v1", "logs"],
    }
    with check_authorization as false
    with spicedb_key as "key"
    with is_environment_on_prem as true
}

test_logs_saas_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJub25lIn0.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoidWlkQGV4YW1wbGUub3JnIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibm90IGFkbWluIn0."},
        	"method": "GET",
            "path": "/api/v1/logs",
        }}},
        "parsed_path": ["api", "v1", "logs"],
    }
    with check_authorization as true
    with spicedb_key as "key"
    with is_environment_on_prem as false
}

test_openapi_json_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
            "method": "GET",
            "path": "/openapi.json",
        }}},
        "parsed_path": ["openapi.json"],
    }
}

mockSend(response) = response {
    response
}
