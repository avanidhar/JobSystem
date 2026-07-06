import { expect, test } from "@playwright/test";

import { API_BASE_URL, uniqueJobName } from "./support";

test.describe("Delete job", () => {
  test("deleting a job removes it from the job list", async ({ page, request }) => {
    const jobName = uniqueJobName("Delete");

    // Seed the job directly via the API so this test is isolated from the
    // create flow (covered by its own spec) and starts from a known state.
    await request.post(`${API_BASE_URL}/api/jobs/`, { data: { name: jobName } });

    await page.goto("/");
    const row = page.locator("table.jobs-list tbody tr", { hasText: jobName });
    await expect(row).toBeVisible();

    await row.locator(".job-row-actions__trigger").click();
    await page.click("button[role='menuitem']:has-text('Delete')");
    await page.waitForSelector(".modal");

    await page.click(".delete-job-modal__button--danger");
    await expect(page.locator(".modal")).toHaveCount(0);

    await expect(
      page.locator("table.jobs-list tbody tr", { hasText: jobName }),
    ).toHaveCount(0);
  });
});
