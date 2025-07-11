# GET /organizations/{organization_id}/workspaces
# Get a list of workspaces
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces"] = parsed_path
	print("Policy: list of workspaces")
	is_valid_api_version(api_ver)

	user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/status
allow if {
    http_request.method == "GET"
    ["api", api_ver, "status"] = parsed_path
	is_valid_api_version(api_ver)
}

# Restrict access to GET /api/<api_ver>/organizations/{organization_id}/status endpoint to organization_contributor
allow if {
    http_request.method == "GET"
    ["api", api_ver, "organizations", organization_id, "status"] = parsed_path
    is_license_valid
	is_valid_api_version(api_ver)

    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects
# Create project, user should be granted with "create_new_project" workspace level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Create project")
	user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "create_new_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects_names
# Get a list of workspace projects names, user should be granted with "view_workspace" workspace level permission
# Projects filtering based on user permissions is performed in the origin
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects_names"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get projects names")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects
# Get a list of workspace projects, user should be granted with "view_workspace" workspace level permission
# Projects filtering based on user permissions is performed in the origin
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get projects")
	user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}
# Get project, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/supported_algorithms
# Get project supported algorithms, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "supported_algorithms"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get project's supported algorithms")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/settings/annotation_templates
# Get the annotation templates of the project, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "settings", "annotation_template"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get project's annotation templates")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/settings/annotation_templates
# Create an annotation template, user should be granted with "edit_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "settings", "annotation_template"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Create an annotation template for the project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "edit_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# PUT /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}
# Edit project, user should be granted with "edit_project" project level permission
allow if {
	http_request.method == "PUT"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Update project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "edit_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# DELETE /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}
# Delete project, user should be granted with "delete_project" project level permission
allow if {
	http_request.method == "DELETE"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Delete project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "delete_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/{dataset_id}/media/videos/{video_id}
# Get video details for inference gateway from resource ms
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets", dataset_id, "media", "videos", video_id] = array.slice(parsed_path, 0, 13)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get video details for inference gateway", parsed_path)
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-inference-gateway"
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/{dataset_id}/media/images/{image_id}/predictions/latest
# Cached image prediction operation for inference gateway
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets", dataset_id, "media", "images", image_id, "predictions", "latest"] = array.slice(parsed_path, 0, 15)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Cached image prediction operation", parsed_path)
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-inference-gateway"
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/{dataset_id}/media/images/{image_id}/predictions/latest
# Cached image prediction operation for user
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets", dataset_id, "media", "images", image_id, "predictions", "latest"] = array.slice(parsed_path, 0, 15)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Cached image prediction operation", parsed_path)
    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}


# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/{dataset_id}/media/videos/{video_id}/predictions/latest
# Cached video prediction operation for inference gateway
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets", dataset_id, "media", "videos", video_id, "predictions", "latest"] = array.slice(parsed_path, 0, 14)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Cached video prediction operation", parsed_path)
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-inference-gateway"
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/{dataset_id}/media/videos/{video_id}/predictions/latest
# Cached video prediction operation for user
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets", dataset_id, "media", "videos", video_id, "predictions", "latest"] = array.slice(parsed_path, 0, 14)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Cached video prediction operation", parsed_path)
    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/thumbnail
# Get project thumbnail, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "thumbnail"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get project thumbnail")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets/*
# Project dataset operations, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project dataset operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}


# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/predict
# Get an image prediction, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "predict"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get an image prediction", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/predict/status
# Get inference server status for project, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "predict", "status"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get inference server status for project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}


# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups/{model_group_id}/models/{model_id}:optimize
# Optimize a model for speed with POT (Post-training Optimization Tool), user should be granted with "view_project" project level permission
allow if {
    http_request.method == "POST"
    ["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "model_groups", model_group_id, "models", command] = array.slice(parsed_path, 0, 12)
    regex.match(".{24}:optimize", command)
    model_id := substring(command, 0, 24)
    is_license_valid
    is_valid_api_version(api_ver)

    print("Policy: Optimize model operation", parsed_path)
    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
    check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
    check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}


# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups/{model_group_id}/models/{model_id}:purge
# Purge model operation, user should be granted with "edit_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "model_groups", model_group_id, "models", command] = array.slice(parsed_path, 0, 12)
    regex.match(".{24}:purge", command)
	model_id := substring(command, 0, 24)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Purge model operation", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "edit_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups/*
# Project model groups operations, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "model_groups"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project model groups operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/model_groups/*
allow if {
    ["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "model_groups"] = array.slice(parsed_path, 0, 9)
    is_license_valid
	is_valid_api_version(api_ver)

    print("Policy: Project model groups operations", parsed_path)
    input.attributes.source.principal == "spiffe://cluster.local/ns/impt/sa/impt-modelregistration"
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/models
# Project model listing operation, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "models"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project model list operation", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/train
# Train a model, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "train"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Train a model", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}:train
# Train a model, user should be granted with "view_project" project level permission
allow if {
    http_request.method == "POST"
    ["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", command] = parsed_path
    regex.match(".{24}:train", command)
    project_id := substring(command, 0, 24)
    is_license_valid
    is_valid_api_version(api_ver)

    print("Policy: Train a model", parsed_path)
    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
    check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
    check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}



# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/jobs
# Workspace jobs listing operation, user should be granted with "view_workspace" workspace level permission
allow if {
    http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "jobs"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Workspace jobs listing")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/jobs/{job_id}
# Workspace job operations, user should be granted with "view_job" workspace level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "jobs", job_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Workspace job operations")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "job", job_id, "view_job", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/jobs/{job_id}:cancel
# Workspace job cancellation operation, user should be granted with "view_job" workspace level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "jobs", command] = parsed_path
	regex.match(".{24}:cancel", command)
	job_id := substring(command, 0, 24)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Cancel job")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "job", job_id, "view_job", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/status
# Get project status, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "GET"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "status"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Get project status")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# GET /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/incremental_learning_status
# Get incremental learning status, user should be granted with "view_project" project level permission
allow if {
    http_request.method == "GET"
    ["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "incremental_learning_status"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

    print("Policy: Get incremental learning status")
    user_id := resolve_user_id(http_request.headers)
    check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/configuration
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/configuration/*
# Project configuration operations, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "configuration"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project configuration operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/datasets
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/datasets/*
# Workspace datasets operations, user should be granted with "view_workspace" workspace level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "datasets"] = array.slice(parsed_path, 0, 7)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Workspace datasets operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/datasets:prepare-for-import
# Prepare dataset for import, user should be granted with "view_workspace" workspace level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "datasets:prepare-for-import"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Prepare dataset for import")
	user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects:import-from-dataset
# Import project from dataset, user should be granted with "view_workspace" workspace level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects:import-from-dataset"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Import project from dataset")
	user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "view_workspace", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/datasets:prepare-for-import
# Prepare dataset for import to project, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "datasets:prepare-for-import"] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Prepare dataset for import to project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}:import-from-dataset
# Import dataset to project, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", command] = parsed_path
	regex.match(".{24}:import-from-dataset", command)
	project_id := substring(command, 0, 24)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Import dataset to project")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}:export
# Export project operations, user should be granted with "can_manage" project level permission
allow if {
    http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", command] = parsed_path
	regex.match(".{24}:export", command)
	project_id := substring(command, 0, 24)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Export project", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "can_manage", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/exports/*
# Export project operations, user should be granted with "can_manage" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "exports"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Export project operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "can_manage", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/uploads
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/uploads/*
# Workspace project upload operations, user should be granted with "can_manage" workspace level permission
allow if {
    ["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", "uploads"] = array.slice(parsed_path, 0, 8)
	is_license_valid
	is_valid_api_version(api_ver)

    print("Policy: Import project operations", parsed_path)
    user_id := resolve_user_id(http_request.headers)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
    check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_manage", user_id)
    check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects:import
# Import project, user should be granted with "can_manage" workspace level permission
allow if {
    http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects:import"] = array.slice(parsed_path, 0, 7)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Import project operations", parsed_path)
	check_relation(spicedb_address, spicedb_key, "workspace", workspace_id, "parent_organization", "organization", organization_id)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_manage", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/tests
# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/tests/*
# Project test operations, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "tests"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project test operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /user_settings
# User settings without project
allow if {
	is_user_settings_route
	not parsed_query.project_id

	print("Policy: User settings (not project related)")
	is_license_valid
}

# * /user_settings?project_id={project_id}
# User settings
allow if {
	is_user_settings_route
	parsed_query.project_id
	is_license_valid

	print("Policy: User settings (project related)")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", parsed_query.project_id[0], "view_project", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/deployment_package:download
# Project code deployments operations, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "deployment_package:download"] = array.slice(parsed_path, 0, 9)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Project deployment package operations", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/pipelines/{pipeline_id}/status
# Inference gateway pipeline status endpoint, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "pipelines", pipeline_id, "status"] = array.slice(parsed_path, 0, 11)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Inference gateway pipeline status endpoint", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}

# * /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/models/{model_id}/status
# Inference gateway models status endpoint, user should be granted with "view_project" project level permission
allow if {
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "models", model_id, "status"] = array.slice(parsed_path, 0, 11)
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Inference gateway models status endpoint", parsed_path)
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
}


# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/models/{model_id}
# Request prediction with a model, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "models", model_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Request prediction with a model")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/pipelines/{task_id}:prompt
# POST /api/<api_ver>/organizations/{organization_id}/workspaces/{workspace_id}/projects/{project_id}/pipelines/{pipeline_id}
# Request prediction with a pipeline or prompt with {task_id}:prompt, user should be granted with "view_project" project level permission
allow if {
	http_request.method == "POST"
	["api", api_ver, "organizations", organization_id, "workspaces", workspace_id, "projects", project_id, "pipelines", pipeline_id] = parsed_path
	is_license_valid
	is_valid_api_version(api_ver)

	print("Policy: Request prediction with a pipeline")
	user_id := resolve_user_id(http_request.headers)
	check_authorization_allowing_pat(spicedb_key, "project", project_id, "view_project", user_id)
	check_authorization_allowing_pat(spicedb_key, "organization", organization_id, "can_contribute", user_id)
	check_authorization_allowing_pat(spicedb_key, "workspace", workspace_id, "can_contribute", user_id)
	check_relation(spicedb_address, spicedb_key, "project", project_id, "parent_workspace", "workspace", workspace_id)
}

# Restrict GET /grafana interaction to admins
allow if {
	["api","v1","grafana"] = array.slice(parsed_path, 0, 3)
	is_license_valid

	user_id := resolve_user_id(http_request.headers)

    does_user_have_any_admin_role(user_id)
}

is_user_settings_route if {
	["api", api_ver, "user_settings"] = parsed_path
	is_valid_api_version(api_ver)
}

is_health_route if {
	some route in health_routes
	route == parsed_path[0]
}

allow if {
    http_request.path in [
        "/api/v1/product_info"
    ]
    is_license_valid
}

# Allow for gRPC connections
allow if {
    input.attributes.destination.address.socketAddress.portValue in [
        5001,  # account service
        5555,  # model registration
        8001,  # model mesh
        8085,  # model mesh
        50051, # all the rest
    ]
    is_license_valid
}
