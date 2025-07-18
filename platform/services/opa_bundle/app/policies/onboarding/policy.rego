# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

# Allow to POST /api/v1/onboarding/user (taking into account that there is a rewrite removing /api/v1 prefix)
allow if {
    parsed_path = ["onboarding", "user"]

    http_request.method == "POST"
}
#
# Restrict /api/v1/admin/onboarding/tokens interaction to SaaS admins (taking into account that there is a rewrite removing /api/v1 prefix)
allow if {
    parsed_path = ["admin", "onboarding", "tokens"]

    http_request.method == "POST"

    is_internal_user(http_request.headers)
}
