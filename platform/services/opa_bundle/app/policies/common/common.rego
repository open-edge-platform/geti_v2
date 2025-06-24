#  INTEL CONFIDENTIAL
#
#  Copyright (C) 2024 Intel Corporation
#
#  This software and the related documents are Intel copyrighted materials, and your use of them is governed by
#  the express license under which they were provided to you ("License"). Unless the License provides otherwise,
#  you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
#  without Intel's prior written permission.
#
#  This software and the related documents are provided as is, with no express or implied warranties,
#  other than those that are expressly stated in the License.

package istio.authz

import future.keywords
import future.keywords.every
import future.keywords.in
import input.attributes.request.http as http_request
import input.parsed_path
import input.parsed_query

default allow := false

# `result["allowed"]` must be set to enable usage of custom body/headers/status
result["allowed"] := allow

# Set response body for request rejected because of invalid license, to differentiate from other HTTP 403 responses.
result["body"] := "License is invalid." if {
    not allow
    not is_license_valid
} else := "" if {
    true
}

# parsed_path[0] for known health check routes
health_routes := ["health", "healthz"]

# use spicedb_key to call SpiceDB REST API from OPA policies
runtime := opa.runtime()

spicedb_key := runtime.env.SPICEDB_GRPC_PRESHARED_KEY
spicedb_address := runtime.env.SPICEDB_ADDRESS

# Allow traffic to health check endpoints
allow if {
	is_health_route
	http_request.method == "GET"
}

# Allow traffic to license validity check endpoint
allow if {
	http_request.path == "/api/v1/license/valid"
	http_request.method == "GET"
}

# Resolve the base64 encoded and trimmed user id.
resolve_user_id(headers) := uid_base64 if {
	uid_plain := resolve_user_id_from_jwt(headers)
	print("Resolved UID: ", uid_plain)
	uid_base64 := trim_right(base64.encode(uid_plain), "=")
	print("Resolved base64 UID: ", uid_base64)
}

# Resolve the user id from the JWT in x-auth-request-access-token header
resolve_user_id_from_jwt(headers) := uid if {
	access_token := headers["x-auth-request-access-token"]
	[_, payload, _] := io.jwt.decode(access_token)
	uid := payload.preferred_username

	print("UID determined from x-auth-request-access-token: ", uid)
}

# Resolve the user roles from the JWT in x-auth-request-access-token header
resolve_user_roles_from_jwt(headers) := roles if {
	access_token := headers["x-auth-request-access-token"]
	[_, payload, _] := io.jwt.decode(access_token)
	roles := payload.roles

	print("Roles determined from x-auth-request-access-token: ", roles)
}

resolve_org_id_from_jwt(headers) := org_id if {
    access_token := headers["x-auth-request-access-token"]
	[_, payload, _] := io.jwt.decode(access_token)
	org_id := payload.organization_id

	print("Organization ID from x-auth-request-access-token: ", org_id)
}

resolve_jwt_source(headers) := source if {
	access_token := headers["x-auth-request-access-token"]
	[_, payload, _] := io.jwt.decode(access_token)
	source := payload.source
	print("Source of the received JWT: ", source)
}

resolve_subject_type := "user" if {
	resolve_jwt_source(http_request.headers) == "browser"
}
else := "service_account" if {
	resolve_jwt_source(http_request.headers) == "pat"
}

check_user_identity(accessed_user_id, headers) if {
	accessed_user_id == resolve_user_id_from_jwt(headers)
}

check_user_organization_admin_permissions(org_id, user_id) if {
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}


# Check authorization will resolve correct subject type according to the source of the received JWT
check_authorization(auth_token, resource_type, resource_id, permission, subject_id) := check_authorization_spicedb(spicedb_address, auth_token, resource_type, resource_id, permission, "user", subject_id) if {
	resolve_jwt_source(http_request.headers) == "browser"
}

check_authorization_allowing_pat(auth_token, resource_type, resource_id, permission, subject_id) := check_authorization_spicedb(spicedb_address, auth_token, resource_type, resource_id, permission, "user", subject_id) if {
	resolve_jwt_source(http_request.headers) == "browser"
}
else := check_authorization_spicedb(spicedb_address, auth_token, resource_type, resource_id, permission, "service_account", subject_id) if {
	resolve_jwt_source(http_request.headers) == "pat"
}

check_authorization_spicedb(spicedb_address, auth_token, resource_type, resource_id, permission, subject_type, subject_id) := response if {
	print("Checking", permission, "permission for", resource_type, "object", resource_id, "and", subject_type, "subject", subject_id)
	request := {
		"url": sprintf("http://%s:8443/v1/permissions/check", [spicedb_address]),
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"Authorization": concat(" ", ["Bearer", auth_token]),
		},
		"body": {
			"resource": {
				"objectType": resource_type,
				"objectId": resource_id,
			},
			"permission": permission,
			"subject": {"object": {
				"objectType": subject_type,
				"objectId": subject_id,
			}},
			"consistency": {"fullyConsistent": true},
		},
		"cache": true,
	}
	response := http.send(request)
	response.body.permissionship == "PERMISSIONSHIP_HAS_PERMISSION"
}


check_relation(spicedb_address, spicedb_key, resource_type, resource_id, relation, subject_type, subject_id) := response if {
	request := {
		"url": sprintf("http://%s:8443/v1/relationships/read", [spicedb_address]),
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"Authorization": concat(" ", ["Bearer", spicedb_key])
		},
		"body": {
			"relationshipFilter": {
				"resourceType": resource_type,
				"optionalResourceId": resource_id,
				"optionalRelation": relation,
				"optionalSubjectFilter": {
				  "subjectType": subject_type,
				  "optionalSubjectId": subject_id
				}
			}
		}
	}

	response := http.send(request)
	response.body.result.relationship.relation == relation
}

check_relation_without_validation(spicedb_address, spicedb_key, resource_type, resource_id, relation, subject_type, subject_id) := response if {
	request := {
		"url": sprintf("http://%s:8443/v1/relationships/read", [spicedb_address]),
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"Authorization": concat(" ", ["Bearer", spicedb_key])
		},
		"body": {
			"relationshipFilter": {
				"resourceType": resource_type,
				"optionalResourceId": resource_id,
				"optionalRelation": relation,
				"optionalSubjectFilter": {
				  "subjectType": subject_type,
				  "optionalSubjectId": subject_id
				}
			}
		}
	}

	response := http.send(request)
}

get_subjects_spicedb(spicedb_address, spicedb_key, resource_type, resource_id, relation, subject_type) := subject_id if {
	request := {
		"url": sprintf("http://%s:8443/v1/relationships/read", [spicedb_address]),
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"Authorization": concat(" ", ["Bearer", spicedb_key])
		},
		"body": {
			"relationshipFilter": {
				"resourceType": resource_type,
				"optionalResourceId": resource_id,
				"optionalRelation": relation,
				"optionalSubjectFilter": {
				  "subjectType": subject_type,
				}
			}
		}
	}

	response := http.send(request)
	subject_id := response.body.result.relationship.subject.object.objectId  # works correctly only if there's one subject
}

get_resource_id_spicedb(spicedb_address, spicedb_key, resource_type, relation, subject_type, subject_id) := resource_id if {
	request := {
		"url": sprintf("http://%s:8443/v1/relationships/read", [spicedb_address]),
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"Authorization": concat(" ", ["Bearer", spicedb_key])
		},
		"body": {
			"relationshipFilter": {
				"resourceType": resource_type,
				"optionalRelation": relation,
				"optionalSubjectFilter": {
				  "subjectType": subject_type,
				  "optionalSubjectId": subject_id,
				}
			}
		}
	}

	response := http.send(request)
	resource_id := response.body.result.relationship.resource.objectId  # works correctly only if there's one resource
}

is_health_route if {
	some route in health_routes
	route == parsed_path[0]
}

is_internal_user(headers) if {
    access_token := headers["x-auth-request-access-token"]
    [_, payload, _] := io.jwt.decode(access_token)
    payload.preferred_username == ``
}

# Helper function to check if a string is a valid API version (v followed by digits)
is_valid_api_version(version) {
    startswith(version, "v")
    count(version) > 1
    rest := substring(version, 1, -1)
    regex.match(`^[1-9]+$`, rest)
}

does_user_have_any_admin_role(user_id) if {
    response_org := check_relation_without_validation(spicedb_address, spicedb_key, "organization", null, "organization_admin", "user", user_id)
    response_work := check_relation_without_validation(spicedb_address, spicedb_key, "workspace", null, "workspace_admin", "user", user_id)

    responses := [response_org.body != null, response_work.body != null]
    some i
    responses[i] == true
}

default license_validation := "true"
license_validation := runtime.env.FEATURE_FLAG_LICENSE_VALIDATION

is_license_valid := "true" if license_validation == "false"

else  {
    license_validation == "true"
    request := {
		"url": "http://license:8000/api/v1/license/valid",
		"method": "GET",
		"cache": true,
	}

	response := http.send(request)
	response.status_code == 200
}
