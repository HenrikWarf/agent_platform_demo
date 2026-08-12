variable "project_id" {
  type        = string
  description = "The GCP Project ID"
  default     = "agent-demo-09"
}

variable "region" {
  type        = string
  description = "The GCP Region for resources"
  default     = "us-central1"
}

variable "bigquery_dataset_id" {
  type        = string
  description = "The BigQuery Dataset ID for marketing analytics"
  default     = "marketing_analytics"
}

variable "service_account_id" {
  type        = string
  description = "Service account ID for Agent Platform Cloud Run service"
  default     = "agent-platform-sa"
}

variable "allow_public_unauthenticated" {
  type        = bool
  description = "Whether to allow public unauthenticated access (allUsers) to Cloud Run"
  default     = false
}
