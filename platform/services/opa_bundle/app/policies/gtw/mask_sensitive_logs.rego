package system.log

# Mask http headers in logs to avoid leaking authorization data
mask["/input/attributes/request/http/headers"]
