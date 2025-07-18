# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

is_workspace_admin(subject_id, organization_id) if {
    # TODO in case of multiple workspaces - to be updated in CVS-141620 (workspace id should be taken from URL)
    workspace_id := get_resource_id_spicedb(spicedb_address, spicedb_key, "workspace", "parent_organization", "organization", organization_id)

    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", subject_id)
    check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_manage", subject_id)
}

# Allow access to /api/<api_ver>/organizations/<org_id>/balance for Intel admins
allow if {
	["api", api_ver, "organizations", org_id, "balance"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Allow access to /api/<api_ver>/organizations/<org_id>/balance for users with organization_contributor permission
allow if {
	["api", api_ver, "organizations", org_id, "balance"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/credit_accounts/<acc_id>/balance to intel admins only
allow if {
	["api", api_ver, "organizations", org_id, "credit_accounts", acc_id, "balance"] = parsed_path
	http_request.method == "PUT"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to POST/GET /api/<api_ver>/organizations/<org_id>/credit_accounts to intel admins
allow if {
	["api", api_ver, "organizations", org_id, "credit_accounts"] = parsed_path
	http_request.method in ["POST", "GET"]
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/credit_accounts/<acc_id> to intel admins only
allow if {
	["api", api_ver, "organizations", org_id, "credit_accounts", acc_id] = parsed_path
	http_request.method == "PUT"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/credit_accounts to organization admins
allow if {
	["api", api_ver, "organizations", org_id, "credit_accounts"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	is_workspace_admin(user_id, org_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/transactions/aggregates to organization admins
allow if {
	["api", api_ver, "organizations", org_id, "transactions", "aggregates"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	is_workspace_admin(user_id, org_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/transactions to organization admins
allow if {
	["api", api_ver, "organizations", org_id, "transactions"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	is_workspace_admin(user_id, org_id)
}

# Restrict access to /api/<api_ver>/products/<prod_id> with organization_contributor permission
allow if {
	["api", api_ver, "products", prod_id] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)
}

# Restrict access to /api/<api_ver>/products with organization_contributor permission
allow if {
	["api", api_ver, "products"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/subscriptions for Intel admins
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Allow access to GET, PUT /api/<api_ver>/organizations/<org_id>/subscriptions/active/quotas for Intel admins
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions", "active", "quotas"] = parsed_path
	http_request.method in ["GET", "PUT"]
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/subscriptions/active for Intel admins
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions", "active"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Allow access to POST /api/<api_ver>/organizations/<org_id>/workspaces/<workspace_id>/subscriptions for org admins
allow if {
	["api", api_ver, "organizations", org_id, "workspaces", workspace_id, "subscriptions"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "workspace", workspace_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", org_id)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/subscriptions for org admins
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	is_workspace_admin(user_id, org_id)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/subscriptions/active/quotas for org admins
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions", "active", "quotas"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	is_workspace_admin(user_id, org_id)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/subscriptions/active for all org users
allow if {
	["api", api_ver, "organizations", org_id, "subscriptions", "active"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Allow access to internal (not exposed through Ingress Gateway) endpoints for cron jobs
allow if {
    http_request.path in ["/api/v1/internal/tasks/credit_accounts/rollover",
    "/api/v1/internal/tasks/credit_accounts/rollover/",
    "/api/v1/internal/tasks/credit_accounts/snapshot",
    "/api/v1/internal/tasks/credit_accounts/snapshot/"]

    http_request.method == "POST"
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/credit-system"

}

# Allow access to lease acquire requests for impt-job-ms
allow if {
    http_request.method == "POST"
    ["credit_system_service.LeaseService", "acquire",] = parsed_path

    input.attributes.destination.address.socketAddress.portValue == 5556
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-jobs-ms"

}

# Allow access to lease cancel requests for impt-jobs-scheduler
allow if {
    http_request.method == "POST"
    ["credit_system_service.LeaseService", "cancel",] = parsed_path

    input.attributes.destination.address.socketAddress.portValue == 5556
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-jobs-scheduler"

}

# Allow access to products and subscriptions gRPC endpoints for the onboarding svc
allow if {
    http_request.method == "POST"
    http_request.path in ["/credit_system_service.SubscriptionService/activate",
    "/credit_system_service.SubscriptionService/fail_subscription",
    "/credit_system_service.SubscriptionService/find_active_subscription",
    "/credit_system_service.ProductService/get_all_products"]

    input.attributes.destination.address.socketAddress.portValue == 5556
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/onboarding-service"

}

# Allow access to get quotas requests for impt-job-ms and impt-account-service
allow if {
    http_request.method == "POST"
    ["credit_system_service.QuotaService", "get"] = parsed_path

    input.attributes.destination.address.socketAddress.portValue == 5556
    input.attributes.source.principal in ["spiffe://cluster.local/ns/impt/sa/impt-jobs-scheduling-policy",
    "spiffe://cluster.local/ns/impt/sa/impt-account-service"]

}
