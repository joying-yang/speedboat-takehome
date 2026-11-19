import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mockUsageConsumers(page: Page) {
  await page.route("**/api/v1/usage/consumers?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "usage_consumers",
        start: "2026-04-29T00:00:00Z",
        end: "2026-05-06T00:00:00Z",
        filters: { api_key_id: null, model: null },
        data: [
          {
            api_key_id: "key_01H8ZQYG3M3K2VR9WQ4N5J7P0E",
            api_key_name: "Production - chat service",
            credential: "psk-prodChat01-••••qa9F",
            model: "parasail-llama-3.1-70b-instruct",
            requests: 40_000,
            input_tokens: 20_000_000,
            output_tokens: 10_000_000,
            spend_usd: 15,
          },
          {
            api_key_id: "key_01H8ZR1A8C2QVYJ4MEZ3X9TNRD",
            api_key_name: "CI/CD test runner",
            credential: "psk-ciRunner07-••••Lm21",
            model: "parasail-qwen-2.5-coder-32b",
            requests: 60_000,
            input_tokens: 7_000_000,
            output_tokens: 3_000_000,
            spend_usd: 8,
          },
        ],
      }),
    });
  });
}

test("defaults to API keys and orders the console tabs accordingly", async ({ page }) => {
  await page.goto("/console");

  await expect(page).toHaveURL(/\/console\/keys$/);
  const tabs = page
    .getByRole("navigation", { name: "API console sections" })
    .getByRole("link");
  await expect(tabs).toHaveText(["API keys", "Usage"]);
  await expect(tabs.first()).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "API keys" })).toBeVisible();
});

test("loads seeded usage and navigates to keys", async ({ page }) => {
  await mockUsageConsumers(page);
  await page.goto("/console/usage");
  await expect(page.getByRole("heading", { name: "Usage overview" })).toBeVisible();
  await expect(page.getByText("$26.21")).toBeVisible();
  await expect(page.getByText("Total spend")).toBeVisible();
  await expect(page.getByText("Total requests")).toHaveCount(0);
  await expect(page.getByText("vs previous period")).toBeVisible();

  const metricTabs = page.getByLabel("Usage metric");
  await metricTabs.getByRole("button", { name: "Requests" }).click();
  await expect(page.getByText("Total requests")).toBeVisible();
  await expect(page.getByText("Total spend")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Requests over time" })).toBeVisible();

  await metricTabs.getByRole("button", { name: "Tokens" }).click();
  await expect(page.getByText("Total tokens")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tokens over time" })).toBeVisible();
  const consumersTable = page.getByRole("table", { name: "Top consumers" });
  await expect(consumersTable).toBeVisible();
  await expect(consumersTable.getByRole("columnheader", { name: "Spend" })).toBeVisible();
  await expect(consumersTable.getByRole("columnheader", { name: "Tokens" })).toBeVisible();
  await expect(consumersTable.getByRole("columnheader", { name: "Requests" })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const viewProductionKey = consumersTable.getByRole("button", {
    name: "View key: Production - chat service",
  });
  await expect(viewProductionKey).toHaveText("View");
  await viewProductionKey.click();
  await expect(page).toHaveURL(/\/console\/keys\?q=Production%20-%20chat%20service/);
  await expect(page.getByRole("heading", { name: "API keys" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("Production - chat service");
  await expect(page.getByRole("columnheader", { name: "Scopes" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toHaveCount(0);
  const productionRow = page.getByRole("row").filter({ hasText: "Production - chat service" });
  await expect(productionRow).toContainText("inference:read");
  await expect(productionRow).toContainText("inference:write");
});

test("opens the create-key workflow", async ({ page }) => {
  await page.goto("/console/keys");
  await page.getByRole("button", { name: "Create key" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create API key" })).toBeVisible();
  const dialog = page.getByRole("dialog", { name: "Create API key" });
  const inferenceRead = dialog.getByRole("checkbox", { name: /Inference read.*inference:read/ });
  const inferenceWrite = dialog.getByRole("checkbox", { name: /Inference write.*inference:write/ });
  const admin = dialog.getByRole("checkbox", { name: /Administrator access/ });
  const alertGuidance = dialog.getByText(
    "Choose when alerts trigger. Delivery destination is not yet defined.",
  );
  const fiftyPercent = dialog.getByRole("checkbox", { name: "50%" });
  await expect(alertGuidance).toBeVisible();
  await expect(fiftyPercent).toBeDisabled();
  await dialog.getByRole("textbox", { name: /Monthly cap/ }).fill("25");
  await expect(alertGuidance).toBeVisible();
  await expect(fiftyPercent).toBeEnabled();
  await expect(inferenceRead).toBeChecked();
  await expect(inferenceWrite).toBeChecked();
  await admin.check();
  await expect(inferenceRead).toBeDisabled();
  await admin.uncheck();
  await expect(inferenceRead).toBeEnabled();
  const inferenceReadCell = inferenceRead.locator("xpath=ancestor::td");
  const cellBounds = await inferenceReadCell.boundingBox();
  if (!cellBounds) throw new Error("Inference read cell is not visible.");
  await inferenceReadCell.click({
    position: { x: cellBounds.width - 8, y: cellBounds.height / 2 },
  });
  await expect(inferenceRead).toBeChecked();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("keeps the key console accessible in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/console/keys");
  await expect(page.getByText("Production - chat service")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("switches and remembers the preview color theme", async ({ page }) => {
  await page.goto("/console/keys");
  const theme = page.getByRole("combobox", { name: "Color theme" });

  await theme.selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(theme).toHaveValue("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await theme.selectOption("system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("shows the exact last-used time above the hovered timestamp", async ({ page }) => {
  await page.goto("/console/keys");
  const table = page.getByRole("table", { name: "API keys" });
  const timestamp = table.locator("time").first();
  await expect(timestamp).toBeVisible();
  await timestamp.hover();

  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(/ at /);

  const [timestampBounds, tooltipBounds] = await Promise.all([
    timestamp.boundingBox(),
    tooltip.boundingBox(),
  ]);
  if (!timestampBounds || !tooltipBounds) {
    throw new Error("Last-used tooltip geometry is unavailable.");
  }
  expect(tooltipBounds.y + tooltipBounds.height).toBeLessThan(timestampBounds.y);
});

test("keeps the usage hierarchy at a narrow viewport", async ({ page }) => {
  await mockUsageConsumers(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/console/usage");

  await expect(page.getByRole("navigation", { name: "API console sections" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spend over time" })).toBeVisible();

  const tableCanScrollHorizontally = await page.evaluate(() => {
    const tableScroller = document.querySelector("table")?.parentElement;
    return Boolean(tableScroller && tableScroller.scrollWidth > tableScroller.clientWidth);
  });
  await page.mouse.move(8, 300);
  await page.mouse.wheel(1_000, 0);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
  expect(tableCanScrollHorizontally).toBe(true);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("shows the final even-hour tick in the 24-hour usage view", async ({ page }) => {
  await mockUsageConsumers(page);
  await page.goto("/console/usage?range=24h");

  await expect(page.getByText("10 PM", { exact: true })).toBeVisible();
});

test("uses readable semantic colors for the chart hover state", async ({ page }) => {
  await mockUsageConsumers(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/console/usage");

  const chart = page.locator(".recharts-wrapper");
  const bounds = await chart.boundingBox();
  if (!bounds) throw new Error("Usage chart is not visible.");
  await chart.hover({ position: { x: bounds.width / 2, y: bounds.height / 2 } });

  const tooltip = page.locator(".recharts-default-tooltip");
  await expect(tooltip).toBeVisible();

  const colors = await page.evaluate(() => {
    function resolveColor(token: string) {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }

    const tooltipElement = document.querySelector<HTMLElement>(".recharts-default-tooltip");
    const labelElement = document.querySelector<HTMLElement>(".recharts-tooltip-label");
    const itemElement = document.querySelector<HTMLElement>(".recharts-tooltip-item");
    const cursorElement = document.querySelector<SVGElement>(".recharts-tooltip-cursor");
    const activeDotElement = document.querySelector<SVGElement>(".recharts-active-dot circle");
    if (!tooltipElement || !labelElement || !itemElement || !cursorElement || !activeDotElement) {
      throw new Error("Chart hover elements are incomplete.");
    }

    return {
      tooltipBackground: getComputedStyle(tooltipElement).backgroundColor,
      tooltipText: getComputedStyle(tooltipElement).color,
      labelText: getComputedStyle(labelElement).color,
      itemText: getComputedStyle(itemElement).color,
      cursorStroke: getComputedStyle(cursorElement).stroke,
      activeDotFill: getComputedStyle(activeDotElement).fill,
      surface: resolveColor("--bg-surface"),
      primaryText: resolveColor("--text-primary"),
      tertiaryText: resolveColor("--text-tertiary"),
    };
  });

  expect(colors.tooltipBackground).toBe(colors.surface);
  expect(colors.tooltipText).toBe(colors.primaryText);
  expect(colors.labelText).toBe(colors.primaryText);
  expect(colors.itemText).toBe(colors.primaryText);
  expect(colors.cursorStroke).toBe(colors.tertiaryText);
  expect(colors.activeDotFill).toBe(colors.surface);
});

test("ranks top consumers by spend, tokens, or requests", async ({ page }) => {
  await mockUsageConsumers(page);
  await page.goto("/console/usage");

  const table = page.getByRole("table", { name: "Top consumers" });
  const rows = table.locator("tbody tr");
  const spendHeader = table.getByRole("columnheader", { name: "Spend" });
  const tokensHeader = table.getByRole("columnheader", { name: "Tokens" });
  const requestsHeader = table.getByRole("columnheader", { name: "Requests" });

  await expect(spendHeader).toHaveAttribute("aria-sort", "descending");
  await expect(rows.first()).toContainText("Production - chat service");

  await requestsHeader.getByRole("button", { name: "Requests" }).click();
  await expect(page).toHaveURL(/consumerSort=requests/);
  await expect(requestsHeader).toHaveAttribute("aria-sort", "descending");
  await expect(rows.first()).toContainText("CI/CD test runner");

  await tokensHeader.getByRole("button", { name: "Tokens" }).click();
  await expect(page).toHaveURL(/consumerSort=tokens/);
  await expect(tokensHeader).toHaveAttribute("aria-sort", "descending");
  await expect(rows.first()).toContainText("Production - chat service");

  await spendHeader.getByRole("button", { name: "Spend" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("consumerSort")).toBeNull();
  await expect(spendHeader).toHaveAttribute("aria-sort", "descending");
});

test("paginates top consumers ten rows at a time", async ({ page }) => {
  await page.route("**/api/v1/usage/consumers?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "usage_consumers",
        start: "2026-04-29T00:00:00Z",
        end: "2026-05-06T00:00:00Z",
        filters: { api_key_id: null, model: null },
        data: Array.from({ length: 12 }, (_, index) => ({
          api_key_id: `key-${index}`,
          api_key_name: `Consumer ${index + 1}`,
          credential: `psk-consumer-${index}-••••test`,
          model: `model-${index + 1}`,
          requests: 100 - index,
          input_tokens: 1_000 - index,
          output_tokens: 500 - index,
          spend_usd: 20 - index,
        })),
      }),
    });
  });
  await page.goto("/console/usage");

  const rows = page.getByRole("table", { name: "Top consumers" }).locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(page.getByText("1–10 of 12 consumers")).toBeVisible();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/consumerPage=2/);
  await expect(rows).toHaveCount(2);
  await expect(page.getByText("11–12 of 12 consumers")).toBeVisible();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Previous" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("consumerPage")).toBeNull();
  await expect(rows).toHaveCount(10);
});

test("edits, resets, and protects unsaved key changes", async ({ page }) => {
  await page.goto("/console/keys");
  const editButton = page.getByRole("button", { name: /^Edit / }).first();
  const editLabel = await editButton.getAttribute("aria-label");
  const originalName = editLabel?.replace(/^Edit /, "") ?? "";
  await editButton.click();

  const dialog = page.getByRole("dialog", { name: "Edit API key" });
  const name = dialog.getByRole("textbox", { name: "Key name" });
  await expect(name).toHaveValue(originalName);

  await name.fill("Changed production key");
  await dialog.getByRole("button", { name: "Reset changes" }).click();
  await expect(name).toHaveValue(originalName);

  await name.fill("Unsaved production key");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Discard changes?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep editing" }).click();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await confirmation.getByRole("button", { name: "Discard changes" }).click();
  await expect(dialog).not.toBeVisible();
});

test("saves an API key edit and refreshes the table", async ({ page }) => {
  await page.goto("/console/keys");

  const initialEditButton = page.getByRole("button", { name: /^Edit / }).first();
  const editLabel = await initialEditButton.getAttribute("aria-label");
  const originalName = editLabel?.replace(/^Edit /, "") ?? "";
  const editedName = `${originalName} edited`;
  await initialEditButton.click();
  const dialog = page.getByRole("dialog", { name: "Edit API key" });
  await dialog.getByRole("textbox", { name: "Key name" }).fill(editedName);
  const editResponse = page.waitForResponse((response) =>
    response.request().method() === "PATCH" && response.url().includes("/api/v1/api-keys/"),
  );
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await editResponse;
  await expect(page.getByText(editedName, { exact: true })).toBeVisible();

  // Restore the seeded value so the browser suite leaves the shared mock clean.
  const editedRow = page.getByRole("row").filter({ hasText: editedName });
  await editedRow.getByRole("button", { name: `Edit ${editedName}`, exact: true }).click();
  await dialog.getByRole("textbox", { name: "Key name" }).fill(originalName);
  const restoreResponse = page.waitForResponse((response) =>
    response.request().method() === "PATCH" && response.url().includes("/api/v1/api-keys/"),
  );
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await restoreResponse;
  await expect(page.getByText(originalName, { exact: true })).toBeVisible();
});

test("saves mixed scopes from the edit workflow", async ({ page }) => {
  await page.route("**/api/v1/api-keys?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [{
          id: "key_scope_edit",
          name: "CI/CD test runner",
          prefix: "psk-ciRunner07-",
          last_four: "Lm21",
          scopes: ["inference:read"],
          spend_limit_usd: 25,
          spend_used_usd: 4.18,
          created_at: "2026-03-02T17:05:00Z",
          last_used_at: "2026-05-05T03:42:00Z",
          revoked_at: null,
        }],
      }),
    });
  });
  await page.route("**/api/v1/api-keys/*", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "intercepted-scope-edit" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/console/keys");
  await page.getByRole("searchbox", { name: "Search" }).fill("CI/CD test runner");
  await page.getByRole("button", { name: "Edit CI/CD test runner" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit API key" });
  await dialog.getByRole("checkbox", { name: /Billing read.*billing:read/ }).check();

  const patchRequest = page.waitForRequest((request) =>
    request.method() === "PATCH" && request.url().includes("/api/v1/api-keys/"),
  );
  await dialog.getByRole("button", { name: "Save changes" }).click();
  const request = await patchRequest;
  expect(request.postDataJSON()).toMatchObject({
    scopes: expect.arrayContaining(["inference:read", "billing:read"]),
  });
  await expect(dialog).not.toBeVisible();
});

test("identifies and confirms the exact key before revocation", async ({ page }) => {
  await page.route("**/api/v1/api-keys/*", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "intercepted-revoke" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/console/keys");
  const revokeButton = page.getByRole("button", { name: /^Revoke / }).first();
  const revokeLabel = await revokeButton.getAttribute("aria-label");
  const keyName = revokeLabel?.replace(/^Revoke /, "") ?? "";
  const keyRow = revokeButton.locator("xpath=ancestor::tr");
  const maskedValue = (await keyRow.locator("code").textContent()) ?? "";
  await revokeButton.click();
  const confirmation = page.getByRole("alertdialog", { name: "Revoke API key?" });
  await expect(confirmation).toContainText(keyName);
  await expect(confirmation).toContainText(maskedValue);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(confirmation).not.toBeVisible();

  await page.getByRole("button", { name: `Revoke ${keyName}`, exact: true }).click();
  const deleteRequest = page.waitForRequest((request) =>
    request.method() === "DELETE" && request.url().includes("/api/v1/api-keys/"),
  );
  await confirmation.getByRole("button", { name: "Revoke key" }).click();
  await deleteRequest;
  await expect(confirmation).not.toBeVisible();
});

test("submits selected alert thresholds with a new capped key", async ({ page }) => {
  await page.route("**/api/v1/api-keys", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "key_e2e_alerts",
        name: "E2E alert key",
        prefix: "psk-e2eAlert-",
        last_four: "T123",
        scopes: ["inference:read"],
        spend_limit_usd: 25,
        spend_used_usd: 0,
        created_at: "2026-11-17T00:00:00Z",
        last_used_at: null,
        revoked_at: null,
        secret: "psk-e2eAlert-secretValue",
      }),
    });
  });
  await page.route("**/api/v1/spend-limits", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "lim_e2e",
        ...route.request().postDataJSON(),
        created_at: "2026-11-17T00:00:00Z",
      }),
    });
  });

  await page.goto("/console/keys");
  await page.getByRole("button", { name: "Create key" }).click();
  const dialog = page.getByRole("dialog", { name: "Create API key" });
  await dialog.getByRole("textbox", { name: "Key name" }).fill("E2E alert key");
  await dialog.getByRole("textbox", { name: /Monthly cap/ }).fill("25");

  for (const threshold of [50, 80, 100]) {
    const option = dialog.getByRole("checkbox", { name: new RegExp(`${threshold}%`) });
    await expect(option).not.toBeChecked();
    await option.check();
  }
  await expect(dialog).toContainText(
    "Monthly cap will be set to $25.00 per month.",
  );
  await expect(dialog).toContainText(
    "Alert thresholds will be set at 50%, 80%, and 100% of the monthly cap.",
  );

  const spendRequest = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/api/v1/spend-limits"),
  );
  const createRequest = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/api/v1/api-keys"),
  );
  await dialog.getByRole("button", { name: "Create key" }).click();
  const request = await createRequest;
  expect(request.postDataJSON()).toMatchObject({
    scopes: ["inference:read", "inference:write"],
  });
  const limitRequest = await spendRequest;
  expect(limitRequest.postDataJSON()).toMatchObject({
    scope: "api_key",
    api_key_id: "key_e2e_alerts",
    monthly_limit_usd: 25,
    alert_thresholds_pct: [50, 80, 100],
  });
  const secretDialog = page.getByRole("dialog", { name: "API key created" });
  await expect(secretDialog).toContainText(
    "psk-e2eAlert-secretValue",
  );
  const acknowledgement = secretDialog
    .getByRole("checkbox", { name: "I saved this key in a secure location." })
    .locator("xpath=ancestor::label");
  const completionButton = secretDialog.getByRole("button", { name: "I’ve saved the key" });
  const [acknowledgementBounds, buttonBounds] = await Promise.all([
    acknowledgement.boundingBox(),
    completionButton.boundingBox(),
  ]);
  if (!acknowledgementBounds || !buttonBounds) {
    throw new Error("Secret acknowledgement actions are not visible.");
  }
  expect(acknowledgementBounds.x + acknowledgementBounds.width).toBeLessThan(buttonBounds.x);
  const acknowledgementCenter = acknowledgementBounds.y + acknowledgementBounds.height / 2;
  const buttonCenter = buttonBounds.y + buttonBounds.height / 2;
  expect(Math.abs(acknowledgementCenter - buttonCenter)).toBeLessThan(2);
});

test("keeps the secret visible when alert setup partially fails", async ({ page }) => {
  await page.route("**/api/v1/api-keys", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "key_e2e_partial",
        name: "E2E partial key",
        prefix: "psk-e2ePart-",
        last_four: "P123",
        scopes: ["inference:read"],
        spend_limit_usd: 25,
        spend_used_usd: 0,
        created_at: "2026-11-17T00:00:00Z",
        last_used_at: null,
        revoked_at: null,
        secret: "psk-e2ePart-secretValue",
      }),
    });
  });
  await page.route("**/api/v1/spend-limits", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { type: "server_error", message: "Alert setup failed." },
      }),
    });
  });

  await page.goto("/console/keys");
  await page.getByRole("button", { name: "Create key" }).click();
  const dialog = page.getByRole("dialog", { name: "Create API key" });
  await dialog.getByRole("textbox", { name: "Key name" }).fill("E2E partial key");
  await dialog.getByRole("textbox", { name: /Monthly cap/ }).fill("25");
  await dialog.getByRole("checkbox", { name: /100%/ }).check();
  await dialog.getByRole("button", { name: "Create key" }).click();

  const secretDialog = page.getByRole("dialog", { name: "API key created" });
  await expect(secretDialog).toContainText("psk-e2ePart-secretValue");
  await expect(secretDialog).toContainText("Some settings weren’t saved");
  await expect(secretDialog).toContainText("The alert thresholds weren’t saved.");
});

test("submits replacement alert thresholds while editing", async ({ page }) => {
  await page.route("**/api/v1/spend-limits", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "lim_edit_e2e",
        ...route.request().postDataJSON(),
        created_at: "2026-11-17T00:00:00Z",
      }),
    });
  });

  await page.goto("/console/keys");
  await page.getByRole("button", { name: /^Edit / }).first().click();
  const dialog = page.getByRole("dialog", { name: "Edit API key" });
  const eightyPercent = dialog.getByRole("checkbox", { name: /80%/ });
  await expect(eightyPercent).not.toBeChecked();
  await eightyPercent.check();
  await expect(dialog).toContainText(
    "Alert thresholds will be set at 80% of the monthly cap.",
  );

  const spendRequest = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/api/v1/spend-limits"),
  );
  await dialog.getByRole("button", { name: "Save changes" }).click();
  const request = await spendRequest;
  expect(request.postDataJSON()).toMatchObject({
    scope: "api_key",
    alert_thresholds_pct: [80],
  });
  await expect(dialog).not.toBeVisible();
});

test("shows a warning when key changes save but alert thresholds fail", async ({ page }) => {
  await page.route("**/api/v1/api-keys/*", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "key_partial_edit",
        name: "Partial save test",
        prefix: "psk-partialEdit-",
        last_four: "P456",
        scopes: ["inference:read", "inference:write"],
        spend_limit_usd: 500,
        spend_used_usd: 312.47,
        created_at: "2026-02-14T09:21:00Z",
        last_used_at: "2026-05-04T22:11:43Z",
        revoked_at: null,
      }),
    });
  });
  await page.route("**/api/v1/spend-limits", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { type: "server_error", message: "Alert setup failed." },
      }),
    });
  });

  await page.goto("/console/keys");
  await page.getByRole("button", { name: /^Edit / }).first().click();
  const dialog = page.getByRole("dialog", { name: "Edit API key" });
  await dialog.getByRole("textbox", { name: "Key name" }).fill("Partial save test");
  await dialog.getByRole("checkbox", { name: /80%/ }).check();
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(dialog).toContainText("Some settings weren’t saved");
  await expect(dialog).toContainText(
    "The alert thresholds weren’t saved. Any other key changes were saved.",
  );
});

test("sets an account monthly cap with explicit alert thresholds", async ({ page }) => {
  await page.route("**/api/v1/spend-limits", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "lim_account_e2e",
        ...route.request().postDataJSON(),
        api_key_id: null,
        created_at: "2026-11-17T00:00:00Z",
      }),
    });
  });

  await page.goto("/console/keys");
  await page.getByRole("button", { name: "Set monthly cap" }).click();
  const dialog = page.getByRole("dialog", { name: "Set account monthly cap" });
  await dialog.getByRole("textbox", { name: "Monthly cap" }).fill("1000");
  await expect(dialog.getByRole("checkbox", { name: "50%" })).toBeVisible();
  await expect(dialog.getByText("of monthly cap")).toHaveCount(0);
  await expect(dialog.getByText("$500.00")).toHaveCount(0);
  await dialog.getByRole("checkbox", { name: /80%/ }).check();
  await dialog.getByRole("checkbox", { name: /100%/ }).check();
  await expect(dialog).toContainText(
    "Monthly cap will be set to $1,000.00 per month.",
  );
  await expect(dialog).toContainText(
    "Alert thresholds will be set at 80% and 100% of the monthly cap.",
  );

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const spendRequest = page.waitForRequest((request) =>
    request.method() === "POST" && request.url().endsWith("/api/v1/spend-limits"),
  );
  await dialog.getByRole("button", { name: "Save limit" }).click();
  const request = await spendRequest;
  expect(request.postDataJSON()).toEqual({
    scope: "account",
    monthly_limit_usd: 1000,
    alert_thresholds_pct: [80, 100],
  });
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("$1,000.00")).toBeVisible();
  await expect(page.getByText("Saved this session")).toBeVisible();
});

test("paginates API keys ten rows at a time and resets after filtering", async ({ page }) => {
  const keys = Array.from({ length: 12 }, (_, index) => ({
    id: `key_page_${index + 1}`,
    name: `Test key ${String(index + 1).padStart(2, "0")}`,
    prefix: `psk-page${index + 1}-`,
    last_four: String(index + 1).padStart(4, "0"),
    scopes: ["inference:read"],
    spend_limit_usd: null,
    spend_used_usd: 0,
    created_at: "2026-11-01T00:00:00Z",
    last_used_at: null,
    revoked_at: null,
  }));

  await page.route("**/api/v1/api-keys?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ object: "list", data: keys }),
    });
  });

  await page.goto("/console/keys");
  await expect(page.getByText("1–10 of 12 keys")).toBeVisible();
  await expect(page.getByText("Test key 01", { exact: true })).toBeVisible();
  await expect(page.getByText("Test key 11", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("11–12 of 12 keys")).toBeVisible();
  await expect(page.getByText("Test key 11", { exact: true })).toBeVisible();
  await expect(page.getByText("Test key 01", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();

  await page.getByRole("searchbox", { name: "Search" }).fill("Test key 12");
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByText("1–1 of 1 key")).toBeVisible();
  await expect(page.getByText("Test key 12", { exact: true })).toBeVisible();
});

test("sorts API keys from accessible headers and stores the choice in the URL", async ({ page }) => {
  const keys = [
    {
      id: "key_sort_beta",
      name: "Beta key",
      prefix: "psk-beta-",
      last_four: "0002",
      scopes: ["inference:read"],
      spend_limit_usd: 25,
      spend_used_usd: 5,
      created_at: "2026-11-01T00:00:00Z",
      last_used_at: "2026-11-02T00:00:00Z",
      revoked_at: null,
    },
    {
      id: "key_sort_alpha",
      name: "Alpha key",
      prefix: "psk-alpha-",
      last_four: "0001",
      scopes: ["inference:read"],
      spend_limit_usd: 25,
      spend_used_usd: 20,
      created_at: "2026-11-01T00:00:00Z",
      last_used_at: "2026-11-03T00:00:00Z",
      revoked_at: null,
    },
  ];

  await page.route("**/api/v1/api-keys?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ object: "list", data: keys }),
    });
  });

  await page.goto("/console/keys");
  const table = page.getByRole("table", { name: "API keys" });
  const names = () => table.getByRole("rowheader").allTextContents();

  await table.getByRole("button", { name: "Key name" }).click();
  await expect(page).toHaveURL(/sort=name&direction=asc/);
  await expect.poll(async () => (await names())[0]).toContain("Alpha key");
  await expect(table.getByRole("columnheader", { name: "Key name" }))
    .toHaveAttribute("aria-sort", "ascending");

  await table.getByRole("button", { name: "Key name" }).click();
  await expect(page).toHaveURL(/sort=name&direction=desc/);
  await expect.poll(async () => (await names())[0]).toContain("Beta key");

  await table.getByRole("button", { name: "Key name" }).click();
  await expect(page).not.toHaveURL(/sort=/);
  await expect(table.getByRole("columnheader", { name: "Key name" }))
    .toHaveAttribute("aria-sort", "none");
});

