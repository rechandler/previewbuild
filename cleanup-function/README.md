# Cleanup Function for PR Preview Environments

This Cloud Function automatically cleans up preview environments when a PR is closed or merged.

## What It Does

When a PR is closed or merged, this function:

1. Receives a webhook from GitHub
2. Verifies the webhook signature for security
3. Empties and deletes the Google Cloud Storage bucket associated with the PR
4. Posts a comment to the PR confirming the cleanup

## Deployment

To deploy this function to Google Cloud Functions:

```bash
gcloud functions deploy cleanup-preview-environment \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars GITHUB_WEBHOOK_SECRET=your_secret,GITHUB_TOKEN=your_github_token
```

## Setting Up the GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks > Add webhook
3. Set the Payload URL to the deployed Cloud Function URL
4. Set the Content type to `application/json`
5. Set the Secret to the same value used in the `GITHUB_WEBHOOK_SECRET` environment variable
6. Select "Let me select individual events" and choose "Pull requests"
7. Make sure the webhook is active and click "Add webhook"

## Environment Variables

- `GITHUB_WEBHOOK_SECRET`: The secret used to verify GitHub webhook signatures
- `GITHUB_TOKEN`: A GitHub personal access token with repo permissions to post comments

## Local Testing

For local testing, you can use tools like ngrok to expose your local server to the internet and receive GitHub webhooks.
