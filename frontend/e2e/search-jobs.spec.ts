import { expect, test } from "@playwright/test";

import { API_BASE_URL, uniqueJobName } from "./support";

test.describe("Search jobs", () => {
  test("searching by name filters the job list", async ({ page, request }) => {
    // Two jobs sharing a unique marker in their name, one without it, so a
    // substring search on the marker should show exactly the first two.
    const marker = `Marker${Date.now()}`;
    const matchingJobA = uniqueJobName(`${marker}-A`);
    const matchingJobB = uniqueJobName(`${marker}-B`);
    const nonMatchingJob = uniqueJobName("NoMatch");

    const created = [];
    for (const name of [matchingJobA, matchingJobB, nonMatchingJob]) {
      const response = await request.post(`${API_BASE_URL}/api/jobs/`, { data: { name } });
      created.push(await response.json());
    }

    try {
      await page.goto("/");
      await expect(page.locator("table.jobs-list tbody tr", { hasText: matchingJobA })).toBeVisible();

      await page.fill(".job-search-input", marker);

      // Debounced: both matches show, the non-matching job is filtered out.
      await expect(page.locator("table.jobs-list tbody tr", { hasText: matchingJobA })).toBeVisible();
      await expect(page.locator("table.jobs-list tbody tr", { hasText: matchingJobB })).toBeVisible();
      await expect(
        page.locator("table.jobs-list tbody tr", { hasText: nonMatchingJob }),
      ).toHaveCount(0);

      // Clearing the search restores the unfiltered list.
      await page.fill(".job-search-input", "");
      await expect(
        page.locator("table.jobs-list tbody tr", { hasText: nonMatchingJob }),
      ).toBeVisible();
    } finally {
      for (const job of created) {
        await request.delete(`${API_BASE_URL}/api/jobs/${job.id}/`);
      }
    }
  });

  test("an invalid regex search shows a clear error instead of breaking the page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".jobs-page__create-button")).toBeVisible();

    await page.fill(".job-search-input", "(");

    await expect(page.locator(".jobs-list__message--error")).toContainText(
      "Invalid search pattern",
    );
  });
});
