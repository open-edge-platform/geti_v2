{{- define "configuration.featureFlagsJson" -}}
{
{{- $featureFlags := kindIs "map" .Values.feature_flags_data | ternary .Values.feature_flags_data (fromYaml (.Values.feature_flags_data | toString)) }}
{{- $length := len $featureFlags }}
{{- $index := 0 }}
{{- range $key, $value := $featureFlags }}
  "{{ $key }}": {{ $value }}{{ if lt $index (sub $length 1) }},{{ end }}
  {{- $index = add $index 1 }}
{{- end }}
}
{{- end }}
