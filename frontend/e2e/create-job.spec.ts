import { expect, test } from "@playwright/test";

import { API_BASE_URL, uniqueJobName } from "./support";

test.describe("Create job", () => {
  test("creating a new job shows it in the job list with PENDING status", async ({
    page,
    request,
  }) => {
    const jobName = uniqueJobName("Create");

    await page.goto("/");
    // Not table.jobs-list: with zero jobs (e.g. right after a fresh DB),
    // JobsList intentionally renders a "No jobs yet." message instead of an
    // empty table, but the create button is always present regardless.
    await expect(page.locator(".jobs-page__create-button")).toBeVisible();

    await page.click(".jobs-page__create-button");
    await page.fill("#job-name", jobName);
    await page.click(".create-job-modal__button--primary");
    await expect(page.locator(".modal")).toHaveCount(0);

    // New jobs sort to the top (created_at desc), so it should be visible
    // on the default first page without any pagination navigation.
    const row = page.locator("table.jobs-list tbody tr", { hasText: jobName });
    await expect(row).toBeVisible();
    await expect(row.locator(".status-badge")).toHaveText("Pending");

    // Clean up via the API directly, so this test doesn't depend on the
    // delete flow (covered by its own spec) to leave the DB tidy.
    const listResponse = await request.get(`${API_BASE_URL}/api/jobs/?page_size=100`);
    const { results } = await listResponse.json();
    const created = results.find((job: { name: string }) => job.name === jobName);
    if (created) {
      await request.delete(`${API_BASE_URL}/api/jobs/${created.id}/`);
    }
  });
});
