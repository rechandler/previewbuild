const { execSync } = require("child_process");
const crypto = require("crypto");

/**
 * Handles GitHub webhook events for PR closures.
 * Deletes the corresponding Google Storage bucket when a PR is closed.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.cleanupPreviewEnvironment = async (req, res) => {
  try {
    // Verify GitHub webhook signature
    const signature = req.headers["x-hub-signature-256"];
    if (!signature) {
      console.error("No signature provided");
      return res.status(401).send("Unauthorized");
    }

    // Get the GitHub webhook secret from environment variables
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Webhook secret not configured");
      return res.status(500).send("Server configuration error");
    }

    // Verify the signature
    const hmac = crypto.createHmac("sha256", secret);
    const calculatedSignature =
      "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
    if (signature !== calculatedSignature) {
      console.error("Invalid signature");
      return res.status(401).send("Unauthorized");
    }

    // Process the webhook event
    const event = req.headers["x-github-event"];
    const payload = req.body;

    // Only process PR close events
    if (
      event === "pull_request" &&
      (payload.action === "closed" || payload.action === "merged")
    ) {
      const prNumber = payload.pull_request.number;
      console.log(`Processing PR #${prNumber} ${payload.action} event`);

      // Delete the Google Storage bucket
      const bucketName = `previewbuild-pr-${prNumber}`;
      console.log(`Deleting Google Storage bucket: ${bucketName}`);

      try {
        // Empty the bucket first (required before deletion)
        execSync(`gsutil -m rm -r gs://${bucketName}/**`);
        console.log(`Successfully emptied bucket: ${bucketName}`);

        // Delete the bucket
        execSync(`gsutil rb gs://${bucketName}`);
        console.log(`Successfully deleted bucket: ${bucketName}`);

        // Comment on the PR that the environment has been deleted
        const commentBody = {
          body: `🧹 Preview environment for PR #${prNumber} has been cleaned up and deleted.`,
        };

        // Get the GitHub token from environment variables
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
          const repo = payload.repository.full_name;
          execSync(`curl -X POST \
            -H "Authorization: Bearer ${githubToken}" \
            -H "Accept: application/vnd.github+json" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/${repo}/issues/${prNumber}/comments \
            -d '${JSON.stringify(commentBody)}'`);
          console.log(`Posted cleanup comment to PR #${prNumber}`);
        }

        return res
          .status(200)
          .send(`Preview environment for PR #${prNumber} has been deleted`);
      } catch (error) {
        console.error(`Error cleaning up PR #${prNumber}:`, error);
        return res
          .status(500)
          .send(`Error cleaning up PR #${prNumber}: ${error.message}`);
      }
    } else {
      console.log(`Ignoring event: ${event} with action: ${payload.action}`);
      return res.status(200).send("Event ignored");
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).send("Error processing webhook");
  }
};
