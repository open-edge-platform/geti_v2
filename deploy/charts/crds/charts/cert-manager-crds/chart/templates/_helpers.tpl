{{/*
Check that the user has not set both .installCRDs and .crds.enabled or
set .installCRDs and disabled .crds.keep.
.installCRDs is deprecated and users should use .crds.enabled and .crds.keep instead.
*/}}
{{- define "cert-manager.crd-check" -}}
  {{- if and (.Values.installCRDs) (.Values.crds.enabled) }}
    {{- fail "ERROR: the deprecated .installCRDs option cannot be enabled at the same time as its replacement .crds.enabled" }}
  {{- end }}
  {{- if and (.Values.installCRDs) (not .Values.crds.keep) }}
    {{- fail "ERROR: .crds.keep is not compatible with .installCRDs, please use .crds.enabled and .crds.keep instead" }}
  {{- end }}
{{- end -}}
