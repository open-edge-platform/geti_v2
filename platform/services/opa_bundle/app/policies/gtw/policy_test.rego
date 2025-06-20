# INTEL CONFIDENTIAL
#
# Copyright (C) 2023 Intel Corporation
#
# This software and the related documents are Intel copyrighted materials, and your use of them is governed by
# the express license under which they were provided to you ("License"). Unless the License provides otherwise,
# you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
# without Intel's prior written permission.
#
# This software and the related documents are provided as is, with no express or implied warranties,
# other than those that are expressly stated in the License.

package istio.authz

import future.keywords
import future.keywords.every
import input.attributes.request.http as http_request
import input.parsed_path
import input.parsed_query

test_result_license_valid {
    result == {"allowed": true, "body": ""}
    with allow as true
    with is_license_valid as true
}

test_result_license_invalid_not_allow {
    result == {"allowed": false, "body": "License is invalid."}
    with input as {
        "attributes": {"request": {"http": {
            "method": "GET",
            "path": "/api/v1/workspaces/",
        }}},
        "parsed_path": ["api", "v1", "workspaces"]
        }
    with is_license_valid as false
}

test_result_health_route_and_license_invalid {
    result == {"allowed": true, "body": ""}
    with input as {
        "attributes": {"request": {"http": {
            "method": "GET",
            "path": "/health/",
        }}},
        "parsed_path": [
            "health",
            "",
        ],
    }
    with is_license_valid as false
}

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

test_license_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
            "method": "GET",
            "path": "/api/v1/license/valid",
        }}},
        "parsed_path": ["api","v1","license","valid"],
    }
}

test_license_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
            "method": "POST",
            "path": "/api/v1/license/valid",
        }}},
        "parsed_path": ["api","v1","license","valid"],
    }
}


test_service_account_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
            "path": "/api/v1/service_accounts/",
        }}},
        "parsed_path": ["api", "v1", "service_accounts"],
    } with is_license_valid as true
}

test_service_account_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
            "path": "/api/v1/service_accounts/",
        }}},
        "parsed_path": ["api", "v1", "service_accounts"],
    } with is_license_valid as false
}

test_user_active_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/active",
        }}},
        "parsed_path": ["api", "v1", "users","active"],
    } with is_license_valid as true
}

test_user_active_user__allowed_no_license {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/active",
        }}},
        "parsed_path": ["api", "v1", "users","active"],
    } with is_license_valid as false
}

test_user_workflow_id_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/workflow_id",
        }}},
        "parsed_path": ["api", "v1", "users","workflow_id"],
    } with is_license_valid as true
}

test_user_workflow_id_not_allowed_sample {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/workflow_id",
        }}},
        "parsed_path": ["api", "v1", "users","workflow_id"],
    } with is_license_valid as false
}

test_user_with_anom_route_login_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/login",
        }}},
        "parsed_path": ["api", "v1", "users","login"],
    } with is_license_valid as true
}

test_user_with_anom_route_request_password_reset_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/request_password_reset",
        }}},
        "parsed_path": ["api", "v1", "users","request_password_reset"],
    } with is_license_valid as true
}

test_user_with_anom_route_reset_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/reset_password",
        }}},
        "parsed_path": ["api", "v1", "users","reset_password"],
    } with is_license_valid as true
}

test_user_with_anom_route_confirm_registration_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/users/confirm_registration",
        }}},
        "parsed_path": ["api", "v1", "users","confirm_registration"],
    } with is_license_valid as true
}

test_user_with_anom_route_access_token_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/service_accounts/access_token",
        }}},
        "parsed_path": ["api", "v1", "service_accounts","access_token"],
    } with is_license_valid as true
}

test_user_with_anom_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"method": "POST",
            "path": "/api/v1/service_accounts/access_token",
        }}},
        "parsed_path": ["api", "v1", "service_accounts","access_token"],
    } with is_license_valid as false
}

test_user_confirm_with_anom_route_sign_up_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/registration/sign-up",
        }}},
        "parsed_path": ["api", "v1", "users","registration", "sign-up"],
    } with is_license_valid as true
}

test_user_confirm_with_anom_route_reset_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/users/registration/reset-password",
        }}},
        "parsed_path": ["api", "v1", "users","registration", "reset-password"],
    } with is_license_valid as true
}

test_user_confirm_with_anom_not_allowed {
    not allow with input as {
        "attributes": {"request": {"http": {
        	"method": "GET",
            "path": "/api/v1/service_accounts/access_token",
        }}},
        "parsed_path": ["api", "v1", "users", "get_user_id"],
    } with is_license_valid as false
}

test_update_password_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "POST",
            "path": "/api/v1/users/owner/update_password",
        }}},
        "parsed_path": ["api", "v1", "users", "owner", "update_password"],
    } with is_license_valid as true
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
    } with is_license_valid as true
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
    } with is_license_valid as true
}

test_logs_admin_allowed {
    allow with input as {
        "attributes": {"request": {"http": {
        	"headers": {"x-auth-request-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovLzEwLjU1LjI1Mi4xMDEvZGV4Iiwic3ViIjoiQ2lSamJqMTFhV1JBWlhoaGJYQnNaUzV2Y21jc1pHTTlaWGhoYlhCc1pTeGtZejF2Y21jU0RYSmxaM1ZzWVhKZmRYTmxjbk0iLCJhdWQiOiJmd0NEWEs1dXNWT2hKaHlJWWpnaCIsImV4cCI6MTY4NTUzOTc3OCwiaWF0IjoxNjg1NTM4ODc4LCJhdF9oYXNoIjoibUtxbWN2NzF3ZDl2Q0FSRWZURUR1dyIsImVtYWlsIjoibWFpbEBleGFtcGxlLm9yZyIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsIm5hbWUiOiJ1aWRAZXhhbXBsZS5vcmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbl9pZCI6Im9yZ2lkIn0.JjG-0SaN1-Z4u9vAePK2Jq2xTKQUC9WeCRsLNWHKRS8"},
        	"method": "GET",
            "path": "/api/v1/logs",
        }}},
        "parsed_path": ["api", "v1", "logs"],
    } with is_license_valid as true
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
    } with is_license_valid as true
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
    } with is_license_valid as true
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
    } with is_license_valid as true
}

test_is_users_license_not_restricted {
    response := {
        "status_code": 200,
        "body": {
            "fingerprint": "EE81E4CD57F59D0D",
            "lock_code": "*19Q3XSBGYABCEM8",
            "expiration_date": "2023-06-14 12:24",
            "feature_name": "IntelGeti",
            "vendor_info": "Intel-Corporation",
            "product_id": "ff7eb874-9ed860a7349",
            "num_licenses": "1",
            "users_restricted": false
        }
    }
    is_users_license_not_restricted
    with http.send as mockSend(response)
}

mockSend(response) = response {
    response
}
