{{/* vim: set filetype=mustache: */}}


{{- define "kafka.topic.replicationFactor" -}}
{{ .topic.replicationFactor | default .context.Values.provisioning.replicationFactor }}
{{- end }}

{{- define "kafka.topic.numPartitions" -}}
{{ .topic.partitions | default .context.Values.provisioning.numPartitions }}
{{- end }}

{{- define "kafka.topic.operations" -}}
{{- range $name, $value := .topic.config }}{{ printf "--config %s=%s " $name $value }}{{- end }}
{{- end }}

{{- define "kafka.topic.line" -}}
{{- printf "%s;%s;%s;%s" .topic.name (include "kafka.topic.replicationFactor" (dict "topic" .topic "context" .context )) (include "kafka.topic.numPartitions" (dict "topic" .topic "context" .context )) (include "kafka.topic.operations" (dict "topic" .topic)) -}}
{{- end }}

{{- define "kafka.acl.operations" -}}
{{- range $operation := .acl.operations }}{{ printf "--operation %s " $operation }}{{- end }}
{{- end }}

{{- define "kafka.acl.line" -}}
{{- printf "%s;%s;%s" .acl.topic .acl.user (include "kafka.acl.operations" (dict "acl" .acl )) -}}
{{- end }}

{{/*
Expand the name of the chart.
*/}}
{{- define "kafka-provisioning.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "kafka-provisioning.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}


{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts
*/}}
{{- define "kafka-provisioning.namespace" -}}
  {{- if .Values.namespaceOverride -}}
    {{- .Values.namespaceOverride -}}
  {{- else -}}
    {{- .Release.Namespace -}}
  {{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "kafka-provisioning.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "kafka-provisioning.labels" -}}
helm.sh/chart: {{ include "kafka-provisioning.chart" . }}
{{ include "kafka-provisioning.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "kafka-provisioning.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kafka-provisioning.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "kafka-provisioning.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "kafka-provisioning.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}
