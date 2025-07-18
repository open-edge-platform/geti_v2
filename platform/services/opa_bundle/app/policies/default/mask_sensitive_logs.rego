# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package system.log

# Mask http headers in logs to avoid leaking authorization data
mask["/input/attributes/request/http/headers"]

# Mask http body and parsed body to avoid leaking user email
mask["/input/parsed_body/user/email"]

mask[path] {
    body := input.input.attributes.request.http.body
    parsed_body := json.unmarshal(body)
    parsed_body.user.email

    path := "/input/attributes/request/http/body"
}

# Mask email in path to avoid leaking user email
mask[path] {
    # if there is an `email` field in query, mask it
    input.input.parsed_query.email

    path := "/input/attributes/request/http/path"
}

# Mask email in parsed query to avoid leaking user email
mask[path] {
    input.input.parsed_query.email

    path := "/input/parsed_query/email"
}
