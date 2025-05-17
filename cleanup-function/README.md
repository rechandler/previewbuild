# Preview Environment Cleanup Function

This Cloud Function automatically cleans up PR preview environments when a pull request is closed or merged.

## Deployment Steps

1. First, set up the required secrets:

```bash
# Create a secret for the GitHub webhook
gcloud secrets create github-webhook-secret --replication-policy="automatic"
echo -n "YOUR_GITHUB_WEBHOOK_SECRET" | gcloud secrets versions add github-webhook-secret --data-file=-

# Create a service account for the cleanup function
gcloud iam service-accounts create preview-cleanup-function

# Grant permissions to the service account
gcloud projects add-iam-policy-binding previewbuild \
  --member="serviceAccount:preview-cleanup-function@previewbuild.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding previewbuild \
  --member="serviceAccount:preview-cleanup-function@previewbuild.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

# Grant access to secrets
gcloud secrets add-iam-policy-binding github-webhook-secret \
  --member="serviceAccount:preview-cleanup-function@previewbuild.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding github_token \
  --member="serviceAccount:preview-cleanup-function@previewbuild.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

2. Deploy the Cloud Function:

```bash
gcloud functions deploy preview-cleanup-function \
  --gen2 \
  --runtime=nodejs16 \
  --region=us-central1 \
  --source=. \
  --entry-point=cleanupPreviewEnvironment \
  --trigger-http \
  --service-account=preview-cleanup-function@previewbuild.iam.gserviceaccount.com \
  --set-secrets=GITHUB_WEBHOOK_SECRET=github-webhook-secret:latest,GITHUB_TOKEN=github_token:latest \
  --allow-unauthenticated
```

3. Set up a GitHub webhook:

- Go to your GitHub repository settings
- Click on "Webhooks" > "Add webhook"
- Set the Payload URL to your function's URL (you'll get this after deployment)
- Set Content type to `application/json`
- Set the Secret to the same value you used for the webhook secret above
- Under "Which events would you like to trigger this webhook?", select "Pull requests"
- Click "Add webhook"

Now whenever a pull request is closed or merged, the preview environment will be automatically deleted.
