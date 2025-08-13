{{/*
Return the gateway secret
*/}}
{{- define "gateway.secretName" -}}
    {{- printf "%s-jwt-config" .Release.Namespace }}
{{- end -}}

{{/*
Return the openldap secret
*/}}
{{- define "openldap.secretName" -}}
    {{- printf "%s-ldap-service-user" .Release.Namespace }}
{{- end -}}

{{/*
Return the mongodb secret
*/}}
{{- define "mongodb.secretName" -}}
    {{- printf "%s-mongodb" .Release.Namespace }}
{{- end -}}

{{/*
Return the postgresql secret
*/}}
{{- define "postgresql.secretName" -}}
    {{- printf "%s-postgresql" .Release.Namespace }}
{{- end -}}

{{- define "flyteworkflow.domain" -}}
{{.Values.flyte_workflows.domain }}
{{- end -}}

{{- define "flyteworkflow.name" }}
{{- .Values.main_namespace }}-{{ .Values.flyte_workflows.name }}
{{- end -}}

{{- define "flyteworkflow.namespace" }}
{{- .Values.main_namespace }}-{{ .Values.flyte_workflows.name }}-{{ include "flyteworkflow.domain" . }}
{{- end -}}