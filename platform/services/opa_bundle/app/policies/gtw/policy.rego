# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

allow if {
	http_request.path == "/api/v1/users/"
	http_request.method == "GET"
}

# Allow all users to interact with /api/v1/users/count endpoint
allow if {
	http_request.path == "/api/v1/users/count"
	print("Request for /users/count")
	http_request.method == "GET"
}

# Allow metrics
allow if {
	http_request.path == "/metrics"
	http_request.method == "GET"
}
# Allow traffic to health check endpoints
allow if {
	is_health_route
	http_request.method == "GET"
}

# Allow all users to access openapi.json file (not exposed via Ingress)
allow if {
	http_request.path == "/openapi.json"
}

# Allow all users to interact with /api/v1/service_account endpoint
allow if {
	http_request.path in ["/api/v1/service_accounts/", "/api/v1/service_accounts"]
}

# Allow all users to interact with /api/v1/feature_flags endpoint
allow if {
	http_request.path in ["/api/v1/feature_flags/", "/api/v1/feature_flags"]
}

# Allow all users to interact with /api/v1/users/active endpoint
allow if {
	http_request.path in ["/api/v1/users/active", "/api/v1/users/active/"]
	http_request.method == "GET"
}

# Allow all users to interact with /api/v1/users/workflow_id endpoint
allow if {
	http_request.path in ["/api/v1/users/workflow_id", "/api/v1/users/workflow_id/"]
	http_request.method == "GET"
}

# Allow all users to interact with anonymously accessible routes
allow if {
	http_request.path in [
		"/api/v1/users/login", "/api/v1/users/login/",
		"/api/v1/users/request_password_reset", "/api/v1/users/request_password_reset/",
		"/api/v1/users/reset_password", "/api/v1/users/reset_password/",
		"/api/v1/users/confirm_registration", "/api/v1/users/confirm_registration/",
		"/api/v1/service_accounts/access_token", "/api/v1/service_accounts/access_token/",
	]

	http_request.method == "POST"
}

# Allow all users to confirm actions anonymously
allow if {
	parsed_path in [
		["api", "v1", "users", "registration", "sign-up"],
		["api", "v1", "users", "registration", "sign-up", ""],
		["api", "v1", "users", "registration", "reset-password"],
		["api", "v1", "users", "registration", "reset-password", ""],
	]

	http_request.method == "GET"
}

# Allow api/v1/keys
allow if {
	parsed_path in [
		["api", "v1", "keys"],
		["api", "v1", "keys", ""],
	]

	http_request.method == "GET"
}

# Restrict access to GET /api/v1/users/ endpoint to can_contribute permission owners on resource requested in query
allow if {
	parsed_path in [["api", "v1", "users"], ["api", "v1", "users", ""]]
	http_request.method == "GET"

	user_id := resolve_user_id(http_request.headers)
	check_authorization(
		spicedb_key, parsed_query.access_resource_type[0],
		parsed_query.access_resource_id[0], "can_contribute", user_id,
	)
}

# Restrict POST /api/v1/users/<user_id>/photo to account data owners
allow if {
	["api", "v1", "users", accessed_uid, "photo"] = parsed_path
	http_request.method == "POST"

	check_user_identity(accessed_uid, http_request.headers)
}

# Allow all users for GET /api/v1/users/<user_id>/photo endpoint
allow if {
	["api", "v1", "users", accessed_uid, "photo"] = parsed_path
	http_request.method == "GET"
}

# Restrict POST /api/v1/users/<user_id>/update_password to account data owners
allow if {
	["api", "v1", "users", accessed_uid, "update_password"] = parsed_path
	http_request.method == "POST"

	check_user_identity(accessed_uid, http_request.headers)
}

# Restrict POST /api/v1/users/<user_id>/update_password to admins
allow if {
	["api", "v1", "users", accessed_uid, "update_password"] = parsed_path
	http_request.method == "POST"

	user_id := resolve_user_id(http_request.headers)
	org_id := resolve_organization_id_from_jwt(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}

# Restrict POST /api/v1/organizations/<organizations_id>/users/create to admins
allow if {
	["api", "v1", "organizations", accessed_uid, "users", "create"] = parsed_path
	http_request.method == "POST"

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", accessed_uid, "can_manage", user_id)
}

# Restrict access to PUT /api/v1/organizations/<org_id>/users/<user_id>/statuses endpoint to organization_admin
allow if {
	["api", "v1", "organizations", org_id, "users", accessed_uid, "statuses"] = parsed_path
	http_request.method == "PUT"

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}


# Restrict GET|PUT /api/v1/users/<user_id> to account data owners
allow if {
	["api", "v1", "users", accessed_uid] = parsed_path
	http_request.method in ["GET", "PUT"]

	check_user_identity(accessed_uid, http_request.headers)
}

# Restrict DELETE /api/v1/users/<user_id> to account data owners
allow if {
	["api", "v1", "users", accessed_uid] = parsed_path
	http_request.method == "DELETE"

	check_user_identity(accessed_uid, http_request.headers)
}

# Allow access to PATCH /api/v1/users/<user_id>/roles - permission check is done in the gateway
allow if {
	["api", "v1", "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "PATCH"
}

# Restrict GET /api/v1/users/<user_id>/roles to account data owners
allow if {
	["api", "v1", "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "GET"

	check_user_identity(accessed_uid, http_request.headers)
}

# Restrict DELETE /api/v1/users/<user_id>/sessions to account data owners
allow if {
	["api", "v1", "users", accessed_uid, "sessions"] = parsed_path
	http_request.method == "DELETE"

	check_user_identity(accessed_uid, http_request.headers)
}

# Restrict GET /api/v1/logs to admins and on-prem environments
allow if {
	parsed_path in [["api", "v1", "logs"], ["api", "v1", "logs", ""]]
	http_request.method == "GET"

	is_environment_on_prem
	user_id := resolve_user_id(http_request.headers)
	does_user_have_any_admin_role(user_id)
}

# Restrict GET /api/v1/keys/pem only to API Gateway
allow if {
	["api", "v1", "keys", "pem"] = parsed_path
	http_request.method == "GET"

	input.attributes.source.principal in ["spiffe://cluster.local/ns/istio-system/sa/istio-gateway", "spiffe://cluster.local/ns/istio-ingress/sa/istio-gateway"]
	not has_key(http_request.headers, "x-auth-request-access-token")

}

check_user_identity(accessed_user_id, headers) if {
	accessed_user_id == resolve_user_id_from_jwt(headers)
}

# Resolve the organization id from the JWT in x-auth-request-access-token header
resolve_organization_id_from_jwt(headers) := uid if {
	access_token := headers["x-auth-request-access-token"]
	[_, payload, _] := io.jwt.decode(access_token)
	uid := payload.organization_id

	print("org id determined from x-auth-request-access-token: ", uid)
}

is_environment_on_prem if {
	request := {
		"url": "http://impt-resource:5000/api/v1/product_info",
		"method": "GET",
		"cache": true,
	}

	response := http.send(request)
	response.status_code == 200
	response.body.environment == "on-prem"
}

has_key(x, k) {
	v = x[k]
	v != ""
}
