terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

# 1. Enable Required GCP APIs
locals {
  services = [
    "cloudresourcemanager.googleapis.com",
    "aiplatform.googleapis.com",
    "agentregistry.googleapis.com",
    "cloudapiregistry.googleapis.com",
    "networkservices.googleapis.com",
    "networksecurity.googleapis.com",
    "discoveryengine.googleapis.com",
    "modelarmor.googleapis.com",
    "iap.googleapis.com",
    "apptopology.googleapis.com",
    "observability.googleapis.com",
    "telemetry.googleapis.com",
    "monitoring.googleapis.com",
    "bigquery.googleapis.com",
    "run.googleapis.com",
    "apigateway.googleapis.com",
    "cloudtrace.googleapis.com",
    "logging.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "apikeys.googleapis.com",
    "apphub.googleapis.com"
  ]
}

resource "google_project_service" "gcp_apis" {
  for_each           = toset(local.services)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# 2. Artifact Registry for Container Storage
resource "google_artifact_registry_repository" "agent_repo" {
  depends_on    = [google_project_service.gcp_apis]
  location      = var.region
  repository_id = "agent-platform"
  description   = "Docker container repository for Agent Platform services"
  format        = "DOCKER"
}

# 3. BigQuery Dataset & Tables
resource "google_bigquery_dataset" "marketing_db" {
  depends_on    = [google_project_service.gcp_apis]
  dataset_id    = var.bigquery_dataset_id
  friendly_name = "Marketing Analytics Dataset"
  description   = "Stores customer transactions, RFM segmentation, and campaign metrics"
  location      = var.region
}

resource "google_bigquery_table" "customer_transactions" {
  dataset_id = google_bigquery_dataset.marketing_db.dataset_id
  table_id   = "customer_transactions"

  schema = <<EOF
[
  {
    "name": "transaction_id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Unique transaction ID"
  },
  {
    "name": "customer_id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Customer Profile ID"
  },
  {
    "name": "customer_name",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "email",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "segment",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "amount",
    "type": "NUMERIC",
    "mode": "NULLABLE"
  },
  {
    "name": "transaction_date",
    "type": "TIMESTAMP",
    "mode": "NULLABLE"
  }
]
EOF
}

resource "google_bigquery_table" "customer_rfm_summary" {
  dataset_id = google_bigquery_dataset.marketing_db.dataset_id
  table_id   = "customer_rfm_summary"

  schema = <<EOF
[
  {
    "name": "customer_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "rfm_segment",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "recency_days",
    "type": "INTEGER",
    "mode": "NULLABLE"
  },
  {
    "name": "frequency_orders",
    "type": "INTEGER",
    "mode": "NULLABLE"
  },
  {
    "name": "total_monetary",
    "type": "NUMERIC",
    "mode": "NULLABLE"
  }
]
EOF
}

resource "google_bigquery_table" "customer_demographics_360" {
  dataset_id = google_bigquery_dataset.marketing_db.dataset_id
  table_id   = "customer_demographics_360"

  schema = <<EOF
[
  {
    "name": "customer_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "full_name",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "email",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "age",
    "type": "INTEGER",
    "mode": "NULLABLE"
  },
  {
    "name": "location_city",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "location_country",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "income_bracket",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "preferred_communication_channel",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "favorite_product_features",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "churn_risk_score",
    "type": "NUMERIC",
    "mode": "NULLABLE"
  },
  {
    "name": "lifetime_value_tier",
    "type": "STRING",
    "mode": "NULLABLE"
  }
]
EOF
}

# 4. Service Account & IAM Roles
resource "google_service_account" "agent_sa" {
  depends_on   = [google_project_service.gcp_apis]
  account_id   = var.service_account_id
  display_name = "Agent Platform Service Account"
}

locals {
  iam_roles = [
    "roles/aiplatform.user",
    "roles/bigquery.dataViewer",
    "roles/bigquery.jobUser",
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/storage.admin",
    "roles/agentregistry.editor"
  ]
}

resource "google_project_iam_member" "sa_roles" {
  for_each = toset(local.iam_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.agent_sa.email}"
}

# 5. GCP API Key Provisioning (for Gemini API calls)
resource "google_apikeys_key" "gemini_key" {
  depends_on   = [google_project_service.gcp_apis]
  name         = "gemini-agent-api-key"
  display_name = "Gemini Agent Platform API Key"
  project      = var.project_id

  restrictions {
    api_targets {
      service = "aiplatform.googleapis.com"
    }
  }
}

# 6. Standalone Cloud Run Agent Instances
resource "google_cloud_run_v2_service" "agent_backend" {
  depends_on = [
    google_project_service.gcp_apis,
    google_service_account.agent_sa
  ]
  name     = "agent-platform-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  template {
    service_account = google_service_account.agent_sa.email

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = var.bigquery_dataset_id
      }
      env {
        name  = "USE_GCP_CLOUD"
        value = "true"
      }
      env {
        name  = "MODEL_ARMOR_FLOOR_ID"
        value = "projects/${var.project_id}/locations/${var.region}/floors/marketing-floor"
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service" "agent_frontend" {
  depends_on = [
    google_project_service.gcp_apis,
    google_service_account.agent_sa
  ]
  name     = "agent-platform-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  template {
    service_account = google_service_account.agent_sa.email

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
    }
  }
}

resource "google_cloud_run_v2_service" "agent_simulator" {
  depends_on = [
    google_project_service.gcp_apis,
    google_service_account.agent_sa
  ]
  name     = "agent-platform-simulator"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  template {
    service_account = google_service_account.agent_sa.email

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
    }
  }
}

# 7. Allow Public Unauthenticated Traffic to Cloud Run Services
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  count    = var.allow_public_unauthenticated ? 1 : 0
  location = google_cloud_run_v2_service.agent_backend.location
  name     = google_cloud_run_v2_service.agent_backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  count    = var.allow_public_unauthenticated ? 1 : 0
  location = google_cloud_run_v2_service.agent_frontend.location
  name     = google_cloud_run_v2_service.agent_frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "simulator_public" {
  count    = var.allow_public_unauthenticated ? 1 : 0
  location = google_cloud_run_v2_service.agent_simulator.location
  name     = google_cloud_run_v2_service.agent_simulator.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
