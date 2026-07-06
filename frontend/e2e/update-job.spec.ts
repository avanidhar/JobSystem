import { expect, test } from "@playwright/test";

import { API_BASE_URL, uniqueJobName } from "./support";

test.describe("Update job status", () => {
  test("updating a job's status is reflected in the job list", async ({ page, request }) => {
    const jobName = uniqueJobName("Update");

    // Seed the job directly via the API so this test is isolated from the
    // create flow (covered by its own spec) and starts from a known state.
    const createResponse = await request.post(`${API_BASE_URL}/api/jobs/`, {
      data: { name: jobName },
    });
    const created = await createResponse.json();

    await page.goto("/");
    const row = page.locator("table.jobs-list tbody tr", { hasText: jobName });
    await expect(row).toBeVisible();
    await expect(row.locator(".status-badge")).toHaveText("Pending");

    await row.locator(".job-row-actions__trigger").click();
    await page.click("button[role='menuitem']:has-text('Update')");
    await page.waitForSelector(".modal");

    await page.selectOption("#status-select", "RUNNING");
    await page.click("button:has-text('Update Status')");
    await expect(page.locator(".modal")).toHaveCount(0);

    await expect(row.locator(".status-badge")).toHaveText("Running");

    await request.delete(`${API_BASE_URL}/api/jobs/${created.id}/`);
  });
});
