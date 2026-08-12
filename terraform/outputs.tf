output "project_id" {
  value       = var.project_id
  description = "The GCP Project ID"
}

output "artifact_registry_repo" {
  value       = google_artifact_registry_repository.agent_repo.id
  description = "Artifact Registry Docker repository path"
}

output "bigquery_dataset" {
  value       = google_bigquery_dataset.marketing_db.dataset_id
  description = "BigQuery dataset ID"
}

output "service_account_email" {
  value       = google_service_account.agent_sa.email
  description = "Agent Platform Service Account Email"
}

output "cloud_run_backend_url" {
  value       = google_cloud_run_v2_service.agent_backend.uri
  description = "Live Cloud Run backend endpoint URL"
}

output "cloud_run_frontend_url" {
  value       = google_cloud_run_v2_service.agent_frontend.uri
  description = "Live Cloud Run Web Dashboard Frontend URL"
}

output "cloud_run_simulator_url" {
  value       = google_cloud_run_v2_service.agent_simulator.uri
  description = "Live Cloud Run Traffic Simulator / Load Generator URL"
}

output "gemini_api_key_name" {
  value       = google_apikeys_key.gemini_key.name
  description = "Provisioned API key resource name"
}
