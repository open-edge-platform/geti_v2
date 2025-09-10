# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE


# Restrict /api/<api_ver>/organizations interaction to SaaS admins
allow if {
	parsed_path = ["api", api_ver, "organizations"]
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict /api/<api_ver>/organizations/invitations interaction to SaaS admins
allow if {
	parsed_path = ["api", api_ver, "organizations", "invitations"]
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict /api/<api_ver>/invitations interaction to SaaS admins
allow if {
	parsed_path = ["api", api_ver, "invitations"]
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict PUT /api/<api_ver>/organizations/<org_id> interaction to SaaS admins
allow if {
	parsed_path = ["api", api_ver, "organizations", org_id]
	http_request.method == "PUT"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict /api/<api_ver>/organizations/<org_id>/statuses interaction to SaaS admins
allow if {
	["api", api_ver, "organizations", org_id, "statuses"] = parsed_path
	http_request.method in ["PUT", "GET"]
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id> endpoint to organization_contributor permission
allow if {
	parsed_path = ["api", api_ver, "organizations", org_id]
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/workspaces endpoint to organization_contributor permission
allow if {
	parsed_path = ["api", api_ver, "organizations", org_id, "workspaces"]
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	# temporary solution of the cvs-129112 ticket
	check_authorization_allowing_pat(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/workspaces/<workspace_id> endpoint to workspace_contributor permission
allow if {
	["api", api_ver, "organizations", org_id, "workspaces", workspace_id] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to PUT, POST, DELETE /api/<api_ver>/organizations/<org_id>/workspaces/<workspace_id> endpoint to workspace_admin permission
allow if {
	["api", api_ver, "organizations", org_id, "workspaces", workspace_id] = parsed_path
	http_request.method in ["POST", "PUT", "DELETE"]
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "workspace", workspace_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to POST /api/<api_ver>/organizations/<org_id>/workspaces endpoint to workspace_contributor permission
allow if {
	["api", api_ver, "organizations", org_id, "workspaces"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)

    check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	parsed_query.resourceType[0] in ["workspace", "organization"]
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	not parsed_query.resourceType
	not parsed_query.resourceId
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Allow access to GET /api/<api_ver>/organizations/<org_id>/users endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users?resourceId=<project_id>&resourceType=project endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	parsed_query.resourceType[0] == "project"
    check_authorization(spicedb_key, "project", parsed_query.resourceId[0], "view_project", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users?resourceId=<project_id> endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	not parsed_query.resourceType
	parsed_query.resourceId
    check_authorization(spicedb_key, "project", parsed_query.resourceId[0], "view_project", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users/<users_id> endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid] = parsed_path
	http_request.method in ["GET"]
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<users_id> endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid] = parsed_path
	http_request.method in ["PUT"]
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}

# Restrict access to GET, POST /api/<api_ver>/organizations/<org_id>/users/<users_id>/personal_access_tokens endpoint to organization_admin for user that is in organization
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "personal_access_tokens"] = parsed_path
	http_request.method in ["POST", "GET"]
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", accessed_uid)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}

# Restrict access to POST /api/<api_ver>/personal_access_tokens endpoint to self user in organization
allow if {
	["api", api_ver, "personal_access_tokens"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	org_id := unmarshaled_body.organization_id
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to POST /api/<api_ver>/personal_access_tokens/<token_id> endpoint to self user in organization
allow if {
	["api", api_ver, "personal_access_tokens", token_id] = parsed_path
	http_request.method == "PATCH"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	org_id := unmarshaled_body.organization_id
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET, POST /api/<api_ver>/organizations/<org_id>/users/<users_id>/personal_access_tokens endpoint to self user in organization
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "personal_access_tokens"] = parsed_path
	http_request.method in ["POST", "GET"]
	is_valid_api_version(api_ver)

    check_user_identity(accessed_uid, http_request.headers)
	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to DELETE, PATCH /api/<api_ver>/organizations/<org_id>/users/<users_id>/personal_access_tokens/<token_id> endpoint to self user in organization
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "personal_access_tokens", token_id] = parsed_path
	http_request.method in ["DELETE", "PATCH"]
	is_valid_api_version(api_ver)

    check_user_identity(accessed_uid, http_request.headers)
	user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "user", user_id, "service_accounts", "service_account", base64.encode(token_id))
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to DELETE /api/<api_ver>/personal_access_tokens/<token_id> endpoint to self user in organization
allow if {
	["api", api_ver, "personal_access_tokens", token_id] = parsed_path
	http_request.method == "DELETE"
	is_valid_api_version(api_ver)
}

# Allow /api/<api_ver>/personal_access_tokens/<hash> without limit
allow if {
	["api", api_ver, "personal_access_tokens", hash] = parsed_path
	"organization" != hash
	http_request.method == "GET"
	is_valid_api_version(api_ver)
}

# Allow /api/<api_ver>/personal_access_tokens/organization
allow if {
	["api", api_ver, "personal_access_tokens", "organization"] = parsed_path
	http_request.method == "GET"

	resolve_jwt_source(http_request.headers) == "pat"
	is_valid_api_version(api_ver)
}

# Restrict access to PUT, GET /api/<api_ver>/organizations/<org_id>/users/<users_id> endpoint to organization_contributor as user with <user_id>
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid] = parsed_path
	http_request.method in ["PUT", "GET"]
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
	check_user_identity(accessed_uid, http_request.headers)
}

# Allow internal access to PUT /api/<api_ver>/organizations/<org_id>/users/<users_id>
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid] = parsed_path
	http_request.method == "PUT"
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to POST /api/<api_ver>/organizations/<org_id>/users/invitations endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users", "invitations"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	count(unmarshaled_body.roles) == 2
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_if_objects_are_related_user_invitation(spicedb_key, unmarshaled_body.roles, org_id)
}

# Restrict access to POST /api/<api_ver>/organizations/<org_id>/invitations endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "invitations"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	count(unmarshaled_body.roles) == 2
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_if_objects_are_related_user_invitation(spicedb_key, unmarshaled_body.roles, org_id)
}

# Restrict access to POST /api/<api_ver>/logout to logged in user
allow if {
	["api", api_ver, "logout"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)
}

# Restrict access to GET, POST, DELETE /api/<api_ver>/organizations/<org_id>/membership/<user_id>/roles endpoint to intel admins
allow if {
	["api", api_ver, "organizations", org_id, "membership", accessed_uid, "roles"] = parsed_path
	http_request.method in ["GET", "POST", "DELETE"]
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# GET, POST, DELETE /api/<api_ver>/organizations/<org_id>/membership/me/roles endpoint to organization_contributor (only himself)
allow if {
    # parsed path contains "me" in place of user id - https://jira.devtools.intel.com/browse/CVS-158846
	["api", api_ver, "organizations", org_id, "membership", "me", "roles"] = parsed_path
	http_request.method in ["GET", "POST", "DELETE"]
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/membership/<user_id>/roles endpoint to organization_contributor (only himself)
allow if {
	["api", api_ver, "organizations", org_id, "membership", accessed_uid, "roles"] = parsed_path
	http_request.method in ["GET", "POST", "DELETE"]
	
	is_valid_api_version(api_ver)

    check_user_identity(accessed_uid, http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to GET, POST, DELETE /api/<api_ver>/organizations/<org_id>/membership/<user_id>/roles endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "membership", accessed_uid, "roles"] = parsed_path
	http_request.method in ["GET", "POST", "DELETE"]
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)

#	Check here if a user from request's header is an admin of an organization with {org_id}
#   and if a user with {user_id} belongs to an organization with {org_id}
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to GET, POST, DELETE /api/<api_ver>/organizations/<org_id>/membership/<user_id>/roles endpoint to workspace_admin
allow if {
        ["api", api_ver, "organizations", org_id, "membership", accessed_uid, "roles"] = parsed_path
        http_request.method in ["GET", "POST", "DELETE"]

        is_valid_api_version(api_ver)

        user_id := resolve_user_id(http_request.headers)
        body := replace(http_request.body, "\\\"", "")
        unmarshaled_body = json.unmarshal(body)

        unmarshaled_body.role in ["workspace_admin", "workspace_contributor"]
        check_authorization(spicedb_key, "workspace", unmarshaled_body.resourceId, "can_manage", user_id)

        check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
        check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "PUT"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	check_if_objects_are_related(spicedb_key, unmarshaled_body.roles, org_id)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles endpoint to organization
# contributor who wants to manage project roles
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "PUT"
	
	is_valid_api_version(api_ver)

	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	check_if_objects_are_related(spicedb_key, unmarshaled_body.roles, org_id)
	check_if_user_can_edit_project(spicedb_key, unmarshaled_body.roles, user_id)
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles endpoint to workspace_admin
allow if {
        ["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles"] = parsed_path
        http_request.method == "PUT"
        is_valid_api_version(api_ver)

        user_id := resolve_user_id(http_request.headers)
        body := replace(http_request.body, "\\\"", "")
        unmarshaled_body = json.unmarshal(body)

        every _, role in unmarshaled_body.roles {
            role.role.resourceType == "workspace"
            role.operation in ["CREATE", "DELETE"]
            check_authorization(spicedb_key, "workspace", role.role.resourceId, "can_manage", user_id)
       }

       check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
       check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}


# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles endpoint to owner project delete
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles"] = parsed_path
	http_request.method == "PUT"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	check_if_objects_are_related(spicedb_key, unmarshaled_body.roles, org_id)
	check_user_identity(accessed_uid, http_request.headers)
	check_if_only_role_is_project_delete(unmarshaled_body.roles)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/users/<user_id>/roles/<resource_type> endpoint to organization_contributor as user with <user_id>
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "roles", resource_type] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
	check_user_identity(accessed_uid, http_request.headers)
}

# Restrict access to GET /api/<api_ver>/organizations/<org_id>/activeUser endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "activeUser"] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/users/<user_id>/statuses endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "statuses"] = parsed_path
	http_request.method == "PUT"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
}

# Allow GET /api/<api_ver>/users/<user_id>/memberships endpoint to intel_admins
allow if {
	["api", api_ver, "users", accessed_uid, "memberships"] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Restrict access to PUT /api/<api_ver>/organizations/<org_id>/memberships/<user_id>/ endpoint to intel_admins
allow if {
	["api", api_ver, "organizations", org_id, "memberships", accessed_uid] = parsed_path
	http_request.method in ["PUT", "DELETE"]
	
	is_valid_api_version(api_ver)
    is_internal_user(http_request.headers)

	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to PUT, DELETE /api/<api_ver>/organizations/<org_id>/memberships/<user_id>/ endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "memberships", accessed_uid] = parsed_path
	http_request.method in ["PUT", "DELETE"]
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
}

# Restrict access to GET, POST, DELETE /api/<api_ver>/organizations/<org_id>/users/<user_id>/photos endpoint to any organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "users", accessed_uid, "photos"] = parsed_path
	http_request.method in ["POST", "GET", "DELETE"]
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", base64.encode(accessed_uid))
	check_user_identity(accessed_uid, http_request.headers)
}

# Allow /api/<api_ver>/profile without limit
allow if {
	["api", api_ver, "profile"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)
}

# Allow /api/<api_ver>/organizations/users/external?id without limit
allow if {
	["api", api_ver, "organizations", "users", "external"] = parsed_path
	http_request.method == "GET"
	parsed_query.id
	is_valid_api_version(api_ver)
}

# Allow GET /api/<api_ver>/organizations/<org_id>/memberships endpoint to organization_contributor
allow if {
	["api", api_ver, "organizations", org_id, "memberships"] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	check_authorization(spicedb_key, "organization", org_id, "can_contribute", user_id)
}

# Allow GET /api/<api_ver>/organizations/<org_id>/memberships endpoint to SaaS Admin
allow if {
	["api", api_ver, "organizations", org_id, "memberships"] = parsed_path
	http_request.method == "GET"
	
	is_valid_api_version(api_ver)

	is_internal_user(http_request.headers)
}

# Allow /organization.Organization/* without limit
allow if {
	["organization.Organization"] = array.slice(parsed_path, 0, 1)
	http_request.method == "POST"
}

# Allow /workspace.Workspace/* without limit
allow if {
	["workspace.Workspace"] = array.slice(parsed_path, 0, 1)
	http_request.method == "POST"
}

# Allow /user.User/* without limit
allow if {
	["user.User"] = array.slice(parsed_path, 0, 1)
	http_request.method == "POST"
}

# Restrict /api/<api_ver>/users to SaaS Admins
allow if {
	["api", api_ver, "users"] = parsed_path
	http_request.method == "GET"
	is_valid_api_version(api_ver)
	

    is_internal_user(http_request.headers)
}

# Restrict access to POST /api/<api_ver>/organizations/<org_id>/invitations endpoint to organization_admin
allow if {
	["api", api_ver, "organizations", org_id, "invitations"] = parsed_path
	http_request.method == "POST"
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
	body := replace(http_request.body, "\\\"", "")
	unmarshaled_body = json.unmarshal(body)
	count(unmarshaled_body.roles) == 1
	check_authorization(spicedb_key, "organization", org_id, "can_manage", user_id)
	check_if_objects_are_related_user_invitation_one_role(spicedb_key, unmarshaled_body.roles, org_id)
}

check_if_objects_are_related_user_invitation(spicedb_key, roles, org_id) {
    roles[0].operation == "CREATE"
	roles[0].role.resourceType == "workspace"
	check_relation(spicedb_address, spicedb_key, "workspace", roles[0].role.resourceId, "parent_organization", "organization", org_id)
	roles[1].operation == "CREATE"
	roles[1].role.resourceType == "organization"
	roles[1].role.resourceId == org_id
}

check_if_objects_are_related(spicedb_key, roles, org_id) {
	every _, value in roles {
	value.role.resourceType == "workspace"
	print("workspace role", value.role)
	check_relation(spicedb_address, spicedb_key, "workspace", value.role.resourceId, "parent_organization", "organization", org_id)
	}
}

check_if_objects_are_related(spicedb_key, roles, org_id) {
	every _, value in roles {
	value.role.resourceType == "organization"
	print("org role", value.role)
	value.role.resourceId == org_id
	}
}

check_if_objects_are_related(spicedb_key, roles, org_id) {
	every _, value in roles {
	value.role.resourceType == "project"
	print("project role", value.role)
	workspace_id := get_subjects_spicedb(spicedb_address, spicedb_key, "project", value.role.resourceId, "parent_workspace", "workspace")
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", org_id)
	}
}

check_if_user_can_edit_project(auth_token, roles, user_id) {
    every _, value in roles {
	value.role.resourceType == "project"
	value.operation in ["CREATE", "DELETE"]
	print("can user edit project")
    check_authorization(auth_token, "project", value.role.resourceId, "edit_project", user_id)
    }
}

check_if_only_role_is_project_delete(roles) {
    count(roles) == 1
    some i, value in roles
	value.role.resourceType == "project"
	value.operation == "DELETE"
}

check_if_objects_are_related_user_invitation_one_role(spicedb_key, roles, org_id) {
    roles[0].operation == "CREATE"
	roles[0].role.resourceType == "organization"
	roles[0].role.resourceId == org_id
}

check_if_objects_are_related_user_invitation_one_role(spicedb_key, roles, org_id) {
    roles[0].operation == "CREATE"
	roles[0].role.resourceType == "workspace"
	check_relation(spicedb_address, spicedb_key, "workspace", roles[0].role.resourceId, "parent_organization", "organization", org_id)
}
