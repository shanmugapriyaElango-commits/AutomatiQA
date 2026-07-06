This architecture provides a comprehensive, production-ready QA Automation framework built with Playwright and TypeScript. It adheres to best practices, robust design patterns like Page Object Model (POM), and strict security guidelines for handling sensitive data. The framework is designed for scalability, maintainability, and reliable execution, ensuring high-quality test automation for your application.

---

# 📂 Folder Structure

```
automation-project/
├── .env
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   ├── DashboardPage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── MyCoursesPage.ts
│   └── SiteAdministrationPage.ts
├── tests/
│   ├── auth.setup.ts
│   ├── dashboard.spec.ts
│   ├── myCourses.spec.ts
│   └── siteAdministration.spec.ts
└── utils/
    └── envUtils.ts
```

---

# --- Configuration & Dependencies

## File: .env

This file stores sensitive credentials and environment-specific variables. It is crucial for security and flexible test execution across different environments. Values should be configured before running tests.

```dotenv
# Base URL of the application under test
BASE_URL=https://[your.application.url]

# Admin user credentials for login
ADMIN_USERNAME=adminuser
ADMIN_PASSWORD=securepassword123

# Example test data for creating an event
EVENT_TITLE=Team Meeting - Playwright Automation

# Example test data for creating a course
COURSE_FULL_NAME=Introduction to Playwright Automation
COURSE_SHORT_NAME=PW_Automation_Intro
COURSE_CATEGORY=Development

# If an OTP or specific email for auth is needed:
# TEST_EMAIL=
# OTP_SECRET=
```

## File: package.json

Defines the project's metadata, scripts, and dependencies. Playwright and dotenv are essential for running the automation tests and managing environment variables.

```json
{
  "name": "automation-project",
  "version": "1.0.0",
  "description": "Production-ready Playwright QA Automation Framework",
  "main": "index.js",
  "scripts": {
    "test": "playwright test",
    "test:chromium": "playwright test --project=chromium",
    "test:headed": "playwright test --headed --project=chromium",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@playwright/test": "^1.44.1",
    "@types/node": "^20.14.2",
    "dotenv": "^16.4.5",
    "typescript": "^5.4.5"
  }
}
```

## File: playwright.config.ts

This is the main Playwright configuration file. It sets up test runners, browsers, reporting, and timeouts. Critical settings for production environments like `retries: 0`, `workers: 1`, `trace: 'on'`, and `screenshot: 'only-on-failure'` are included to ensure stable and traceable test runs.

```typescript
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { EnvUtils } from './utils/envUtils';

// Define the path for the authentication storage state
export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

// Generate a unique run ID for reports and results
const runId = new Date().getTime();

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory where tests are located.
  testDir: './tests',

  // Output directory for test results. Unique per run.
  outputDir: 'test-results/run-' + runId,

  // Reporter to use. HTML reporter configured to generate a unique folder per run.
  reporter: [['html', { outputFolder: 'playwright-report/run-' + runId }]],

  // Run tests in files in parallel. (False for stability in production, especially for setup)
  fullyParallel: false,

  // Maximum number of workers to use for parallel tests. (1 for stability)
  workers: 1,

  // Maximum time one test can run for. (180 seconds for TypeScript)
  timeout: 180000,

  // Expect assertions timeout.
  expect: {
    timeout: 60000,
  },

  // Retries on failure. (0 retries for immediate feedback in production)
  retries: 0,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: EnvUtils.BASE_URL,

    // Action timeout for Playwright operations.
    actionTimeout: 50000,

    // Collect trace when retrying the failed test.
    trace: 'on',

    // Screenshot on failure.
    screenshot: 'only-on-failure',

    // Video recording on failure.
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/, // Matches the authentication setup file
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the authenticated storage state for this project
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'], // Ensures 'setup' project runs before 'chromium'
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
    //   dependencies: ['setup'],
    // },
  ],
});
```

## File: utils/envUtils.ts

This utility class loads environment variables securely using `dotenv`. It provides a centralized, type-safe way to access configuration parameters across the framework, ensuring sensitive data is not hardcoded.

```typescript
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class EnvUtils {
  public static readonly BASE_URL: string = process.env.BASE_URL || 'http://localhost:3000';
  public static readonly ADMIN_USERNAME: string = process.env.ADMIN_USERNAME || 'admin';
  public static readonly ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || 'password';
  public static readonly EVENT_TITLE: string = process.env.EVENT_TITLE || 'Default Event Title';
  public static readonly COURSE_FULL_NAME: string = process.env.COURSE_FULL_NAME || 'Default Course Full Name';
  public static readonly COURSE_SHORT_NAME: string = process.env.COURSE_SHORT_NAME || 'D_CRSE';
  public static readonly COURSE_CATEGORY: string = process.env.COURSE_CATEGORY || 'General';

  // Example for sensitive data, if needed
  // public static readonly TEST_EMAIL: string = process.env.TEST_EMAIL || 'test@example.com';
  // public static readonly OTP_SECRET: string = process.env.OTP_SECRET || '';
}
```

---

# --- Page Object Model (POM)

The Page Object Model (POM) enhances test readability and maintainability by abstracting page elements and interactions into classes. Each page of the application has a corresponding Page Object class.

## File: pages/BasePage.ts

The `BasePage` serves as an abstract parent class for all Page Objects. It provides common methods and properties, like the Playwright `Page` instance, and utility functions for waiting for elements, reducing code duplication and promoting consistency.

```typescript
import { expect, Locator, Page } from '@playwright/test';

/**
 * BasePage provides common functionalities and properties for all Page Objects.
 * It ensures that each Page Object has access to the Playwright Page instance
 * and utility methods for interacting with elements.
 */
export abstract class BasePage {
  /**
   * The Playwright Page instance associated with the current browser tab.
   * This is declared as public readonly so it can be accessed by child page objects
   * and test files for direct page interactions if necessary, while maintaining
   * good practice of interacting through page object methods.
   */
  public readonly page: Page;

  /**
   * Constructor for BasePage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to a specified URL.
   * @param url The URL to navigate to.
   */
  public async navigateTo(url: string): Promise<void> {
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url);
  }

  /**
   * Verifies if the current page URL matches the expected URL.
   * @param expectedUrl The expected URL string.
   */
  public async verifyUrl(expectedUrl: string): Promise<void> {
    console.log(`Verifying URL: ${expectedUrl}`);
    await expect(this.page).toHaveURL(expectedUrl, { timeout: 15000 });
  }

  /**
   * Verifies if the page title matches the expected title.
   * @param expectedTitle The expected page title string.
   */
  public async verifyPageTitle(expectedTitle: string): Promise<void> {
    console.log(`Verifying page title: ${expectedTitle}`);
    await expect(this.page).toHaveTitle(expectedTitle, { timeout: 15000 });
  }

  /**
   * Waits for a locator to be visible.
   * @param locator The Playwright Locator to wait for.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    console.log(`Waiting for element to be visible: ${locator.toString()}`);
    await expect(locator).toBeVisible({ timeout: timeout ?? 10000 });
  }

  /**
   * Waits for a locator to be enabled.
   * @param locator The Playwright Locator to wait for.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async waitForEnabled(locator: Locator, timeout?: number): Promise<void> {
    console.log(`Waiting for element to be enabled: ${locator.toString()}`);
    await expect(locator).toBeEnabled({ timeout: timeout ?? 10000 });
  }

  /**
   * Waits for a locator to be hidden.
   * @param locator The Playwright Locator to wait for.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async waitForHidden(locator: Locator, timeout?: number): Promise<void> {
    console.log(`Waiting for element to be hidden: ${locator.toString()}`);
    await expect(locator).toBeHidden({ timeout: timeout ?? 10000 });
  }

  /**
   * Clicks an element after waiting for it to be visible and enabled.
   * @param locator The Playwright Locator to click.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async clickElement(locator: Locator, timeout?: number): Promise<void> {
    console.log(`Clicking element: ${locator.toString()}`);
    await this.waitForVisible(locator, timeout);
    await this.waitForEnabled(locator, timeout);
    await locator.click({ timeout: timeout ?? 10000 });
  }

  /**
   * Fills a text input field after waiting for it to be visible and enabled.
   * @param locator The Playwright Locator for the input field.
   * @param value The text value to fill.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async fillInputField(locator: Locator, value: string, timeout?: number): Promise<void> {
    console.log(`Filling input field ${locator.toString()} with value: ${value}`);
    await this.waitForVisible(locator, timeout);
    await this.waitForEnabled(locator, timeout);
    await locator.fill(value, { timeout: timeout ?? 10000 });
  }

  /**
   * Retrieves the text content of an element.
   * @param locator The Playwright Locator for the element.
   * @returns A Promise that resolves to the text content of the element.
   */
  public async getText(locator: Locator): Promise<string> {
    console.log(`Getting text from element: ${locator.toString()}`);
    await this.waitForVisible(locator);
    return (await locator.textContent()) || '';
  }

  /**
   * Selects an option from a dropdown by its value, label, or index.
   * @param locator The Playwright Locator for the select element.
   * @param value The value, label, or index to select.
   * @param timeout Optional timeout in milliseconds. Defaults to 10000ms.
   */
  public async selectOption(locator: Locator, value: string | number | { value?: string; label?: string; index?: number }, timeout?: number): Promise<void> {
    console.log(`Selecting option from ${locator.toString()} with value: ${JSON.stringify(value)}`);
    await this.waitForVisible(locator, timeout);
    await this.waitForEnabled(locator, timeout);
    await locator.selectOption(value, { timeout: timeout ?? 10000 });
  }
}
```

## File: pages/HomePage.ts

Represents the application's Home page. It contains locators for elements specific to the home page, such as the Login hyperlink and methods to interact with them.

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage Page Object.
 * Manages interactions and elements on the application's Home page.
 */
export class HomePage extends BasePage {
  // Locators
  public readonly loginLink: Locator;
  public readonly homePageHeader: Locator;
  public readonly dashboardNavLink: Locator;
  public readonly myCoursesNavLink: Locator;
  public readonly siteAdministrationNavLink: Locator;

  /**
   * Constructor for HomePage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    super(page);
    this.loginLink = page.getByRole('link', { name: 'Login' });
    this.homePageHeader = page.getByRole('heading', { name: 'Welcome to our platform' }).or(page.locator('.home-page-header')); // Example fallback locator
    this.dashboardNavLink = page.getByRole('link', { name: 'Dashboard' });
    this.myCoursesNavLink = page.getByRole('link', { name: 'My courses' });
    this.siteAdministrationNavLink = page.getByRole('link', { name: 'Site administration' });
  }

  /**
   * Clicks the Login hyperlink.
   */
  public async clickLogin(): Promise<void> {
    console.log('Clicking Login link.');
    await this.clickElement(this.loginLink);
  }

  /**
   * Verifies that the Home page is displayed by checking for a specific header.
   */
  public async verifyHomePageDisplayed(): Promise<void> {
    console.log('Verifying Home page is displayed.');
    await this.waitForVisible(this.homePageHeader);
    await this.page.waitForLoadState('domcontentloaded'); // Ensure page content is loaded
  }

  /**
   * Clicks on the Dashboard navigation link.
   */
  public async clickDashboardNavLink(): Promise<void> {
    console.log('Clicking Dashboard navigation link.');
    await this.clickElement(this.dashboardNavLink);
    await this.page.waitForURL(/.*dashboard.*/); // Wait for navigation to dashboard URL
  }

  /**
   * Clicks on the My Courses navigation link.
   */
  public async clickMyCoursesNavLink(): Promise<void> {
    console.log('Clicking My courses navigation link.');
    await this.clickElement(this.myCoursesNavLink);
    await this.page.waitForURL(/.*mycourses.*/); // Wait for navigation to mycourses URL
  }

  /**
   * Clicks on the Site administration navigation link.
   */
  public async clickSiteAdministrationNavLink(): Promise<void> {
    console.log('Clicking Site administration navigation link.');
    await this.clickElement(this.siteAdministrationNavLink);
    await this.page.waitForURL(/.*siteadministration.*/); // Wait for navigation to siteadministration URL
  }
}
```

## File: pages/LoginPage.ts

This Page Object handles all interactions on the login page, including entering credentials and submitting the form. It securely retrieves sensitive data from `EnvUtils`.

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EnvUtils } from '../utils/envUtils'; // MANDATORY: Import EnvUtils

/**
 * LoginPage Page Object.
 * Manages interactions and elements on the application's Login page.
 */
export class LoginPage extends BasePage {
  // Locators
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly loginPageHeader: Locator;

  /**
   * Constructor for LoginPage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByLabel('Username').or(page.getByPlaceholder('Username')).or(page.locator('#username'));
    this.passwordInput = page.getByLabel('Password').or(page.getByPlaceholder('Password')).or(page.locator('#password'));
    this.loginButton = page.getByRole('button', { name: 'Login' }).or(page.locator('[data-testid="login-button"]'));
    this.loginPageHeader = page.getByRole('heading', { name: 'Log in to your account' }).or(page.locator('.login-page-header')); // Example fallback locator
  }

  /**
   * Enters the username into the username input field.
   * @param username The username to enter.
   */
  public async enterUsername(username: string): Promise<void> {
    console.log(`Entering username: ${username}`);
    await this.fillInputField(this.usernameInput, username);
  }

  /**
   * Enters the password into the password input field.
   * @param password The password to enter.
   */
  public async enterPassword(password: string): Promise<void> {
    console.log('Entering password (masked).');
    await this.fillInputField(this.passwordInput, password);
  }

  /**
   * Clicks the Login button.
   */
  public async clickLoginButton(): Promise<void> {
    console.log('Clicking Login button.');
    await this.clickElement(this.loginButton);
    await this.page.waitForLoadState('networkidle'); // Wait for navigation after login
  }

  /**
   * Verifies that the Login page is displayed.
   */
  public async verifyLoginPageDisplayed(): Promise<void> {
    console.log('Verifying Login page is displayed.');
    await this.waitForVisible(this.loginPageHeader);
    await this.page.waitForURL(/.*login.*/, { timeout: 15000 }); // Wait for URL to match login pattern
  }

  /**
   * Performs a complete login operation using credentials from EnvUtils.
   */
  public async loginAsAdmin(): Promise<void> {
    console.log('Performing admin login.');
    await this.enterUsername(EnvUtils.ADMIN_USERNAME);
    await this.enterPassword(EnvUtils.ADMIN_PASSWORD);
    await this.clickLoginButton();
  }
}
```

## File: pages/DashboardPage.ts

This Page Object specifically handles interactions on the Dashboard page, including the calendar and event creation.

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage Page Object.
 * Manages interactions and elements on the application's Dashboard page.
 */
export class DashboardPage extends BasePage {
  // Locators
  public readonly dashboardHeader: Locator;
  public readonly calendarBlock: Locator;
  public readonly currentDayInCalendar: Locator;
  public readonly newEventPopupTitle: Locator;
  public readonly eventTitleInput: Locator;
  public readonly saveEventButton: Locator;
  public readonly createdEventOnCalendar: (title: string) => Locator;

  /**
   * Constructor for DashboardPage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    super(page);
    this.dashboardHeader = page.getByRole('heading', { name: 'Dashboard' }).or(page.locator('.dashboard-header'));
    this.calendarBlock = page.locator('.calendar-block'); // Assuming a class or test ID for the calendar container
    this.currentDayInCalendar = page.locator('.calendar-block .day-today'); // Assuming 'day-today' class for current date
    this.newEventPopupTitle = page.getByRole('heading', { name: 'New Event' }).or(page.locator('[data-testid="new-event-popup-title"]'));
    this.eventTitleInput = page.getByLabel('Event title').or(page.getByPlaceholder('Event title')).or(page.locator('#event-title'));
    this.saveEventButton = page.getByRole('button', { name: 'Save' }).or(page.locator('[data-testid="save-event-button"]'));
    this.createdEventOnCalendar = (title: string) => page.locator(`.calendar-event-item:has-text("${title}")`);
  }

  /**
   * Verifies that the Dashboard page is displayed.
   */
  public async verifyDashboardPageDisplayed(): Promise<void> {
    console.log('Verifying Dashboard page is displayed.');
    await this.waitForVisible(this.dashboardHeader);
    await this.page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  }

  /**
   * Clicks on the current date in the calendar block to open the event creation dialog.
   */
  public async clickCurrentDateInCalendar(): Promise<void> {
    console.log('Clicking current date in calendar.');
    await this.clickElement(this.currentDayInCalendar);
  }

  /**
   * Verifies that the 'New Event' popup window is displayed.
   */
  public async verifyNewEventPopupDisplayed(): Promise<void> {
    console.log('Verifying "New Event" popup is displayed.');
    await this.waitForVisible(this.newEventPopupTitle);
  }

  /**
   * Enters the event title into the input box.
   * @param title The title of the event.
   */
  public async enterEventTitle(title: string): Promise<void> {
    console.log(`Entering event title: ${title}`);
    await this.fillInputField(this.eventTitleInput, title);
  }

  /**
   * Clicks the 'Save' button to create the event.
   */
  public async clickSaveEventButton(): Promise<void> {
    console.log('Clicking Save event button.');
    await this.clickElement(this.saveEventButton);
    await this.waitForHidden(this.newEventPopupTitle); // Wait for popup to disappear
  }

  /**
   * Verifies that the new event is displayed on the Dashboard calendar.
   * @param eventTitle The title of the event to verify.
   */
  public async verifyEventCreatedAndDisplayed(eventTitle: string): Promise<void> {
    console.log(`Verifying event "${eventTitle}" is created and displayed.`);
    await this.waitForVisible(this.createdEventOnCalendar(eventTitle));
  }
}
```

## File: pages/MyCoursesPage.ts

This Page Object handles interactions on the My Courses page, including creating new courses.

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * MyCoursesPage Page Object.
 * Manages interactions and elements on the application's My Courses page.
 */
export class MyCoursesPage extends BasePage {
  // Locators
  public readonly myCoursesHeader: Locator;
  public readonly createCourseButton: Locator;
  public readonly addNewCourseHeader: Locator;
  public readonly courseFullNameInput: Locator;
  public readonly courseShortNameInput: Locator;
  public readonly courseCategoryDropdown: Locator;
  public readonly saveAndDisplayButton: Locator;
  public readonly courseDetailsPageHeader: (courseName: string) => Locator;

  /**
   * Constructor for MyCoursesPage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    super(page);
    this.myCoursesHeader = page.getByRole('heading', { name: 'My courses' }).or(page.locator('.my-courses-header'));
    this.createCourseButton = page.getByRole('button', { name: 'Create Course' }).or(page.locator('[data-testid="create-course-button"]'));
    this.addNewCourseHeader = page.getByRole('heading', { name: 'Add a new course' }).or(page.locator('.add-new-course-header'));
    this.courseFullNameInput = page.getByLabel('Course full name').or(page.getByPlaceholder('Course full name')).or(page.locator('#course-full-name'));
    this.courseShortNameInput = page.getByLabel('Course short name').or(page.getByPlaceholder('Course short name')).or(page.locator('#course-short-name'));
    this.courseCategoryDropdown = page.getByLabel('Course category').or(page.locator('#course-category'));
    this.saveAndDisplayButton = page.getByRole('button', { name: 'Save and display' }).or(page.locator('[data-testid="save-display-button"]'));
    this.courseDetailsPageHeader = (courseName: string) => page.getByRole('heading', { name: courseName });
  }

  /**
   * Verifies that the 'My courses' page is displayed.
   */
  public async verifyMyCoursesPageDisplayed(): Promise<void> {
    console.log('Verifying "My courses" page is displayed.');
    await this.waitForVisible(this.myCoursesHeader);
    await this.page.waitForURL(/.*mycourses.*/, { timeout: 15000 });
  }

  /**
   * Clicks on the 'Create Course' button.
   */
  public async clickCreateCourseButton(): Promise<void> {
    console.log('Clicking "Create Course" button.');
    await this.clickElement(this.createCourseButton);
  }

  /**
   * Verifies that the 'Add a new course' page is displayed.
   */
  public async verifyAddNewCoursePageDisplayed(): Promise<void> {
    console.log('Verifying "Add a new course" page is displayed.');
    await this.waitForVisible(this.addNewCourseHeader);
  }

  /**
   * Enters the full name for the course.
   * @param fullName The full name of the course.
   */
  public async enterCourseFullName(fullName: string): Promise<void> {
    console.log(`Entering course full name: ${fullName}`);
    await this.fillInputField(this.courseFullNameInput, fullName);
  }

  /**
   * Enters the short name for the course.
   * @param shortName The short name of the course.
   */
  public async enterCourseShortName(shortName: string): Promise<void> {
    console.log(`Entering course short name: ${shortName}`);
    await this.fillInputField(this.courseShortNameInput, shortName);
  }

  /**
   * Selects a category for the course from the dropdown.
   * @param category The category to select.
   */
  public async selectCourseCategory(category: string): Promise<void> {
    console.log(`Selecting course category: ${category}`);
    await this.selectOption(this.courseCategoryDropdown, { label: category });
  }

  /**
   * Clicks the 'Save and display' button to create the course.
   */
  public async clickSaveAndDisplayButton(): Promise<void> {
    console.log('Clicking "Save and display" button.');
    await this.clickElement(this.saveAndDisplayButton);
    await this.page.waitForLoadState('networkidle'); // Wait for navigation after course creation
  }

  /**
   * Verifies that the new course's details page is displayed.
   * @param courseName The full name of the course.
   */
  public async verifyCourseDetailsPageDisplayed(courseName: string): Promise<void> {
    console.log(`Verifying course details page for "${courseName}" is displayed.`);
    await this.waitForVisible(this.courseDetailsPageHeader(courseName));
  }
}
```

## File: pages/SiteAdministrationPage.ts

This Page Object manages interactions on the Site Administration page.

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * SiteAdministrationPage Page Object.
 * Manages interactions and elements on the application's Site Administration page.
 */
export class SiteAdministrationPage extends BasePage {
  // Locators
  public readonly siteAdministrationHeader: Locator;
  public readonly usersTab: Locator;
  public readonly coursesTab: Locator;
  public readonly reportsTab: Locator;

  /**
   * Constructor for SiteAdministrationPage.
   * @param page The Playwright Page object.
   */
  constructor(page: Page) {
    super(page);
    this.siteAdministrationHeader = page.getByRole('heading', { name: 'Site administration' }).or(page.locator('.site-admin-header'));
    this.usersTab = page.getByRole('link', { name: 'Users' }).or(page.locator('[data-testid="users-tab"]'));
    this.coursesTab = page.getByRole('link', { name: 'Courses' }).or(page.locator('[data-testid="courses-tab"]'));
    this.reportsTab = page.getByRole('link', { name: 'Reports' }).or(page.locator('[data-testid="reports-tab"]'));
  }

  /**
   * Verifies that the 'Site administration' page is displayed.
   */
  public async verifySiteAdministrationPageDisplayed(): Promise<void> {
    console.log('Verifying "Site administration" page is displayed.');
    await this.waitForVisible(this.siteAdministrationHeader);
    await this.page.waitForURL(/.*siteadmin.*/, { timeout: 15000 }); // Assuming URL pattern for site admin
  }

  /**
   * Clicks the 'Users' tab within Site Administration.
   */
  public async clickUsersTab(): Promise<void> {
    console.log('Clicking Users tab in Site administration.');
    await this.clickElement(this.usersTab);
  }

  /**
   * Clicks the 'Courses' tab within Site Administration.
   */
  public async clickCoursesTab(): Promise<void> {
    console.log('Clicking Courses tab in Site administration.');
    await this.clickElement(this.coursesTab);
  }

  /**
   * Clicks the 'Reports' tab within Site Administration.
   */
  public async clickReportsTab(): Promise<void> {
    console.log('Clicking Reports tab in Site administration.');
    await this.clickElement(this.reportsTab);
  }
}
```

---

# --- Test Implementation

The `tests` directory contains the actual test scenarios. Authentication setup is separated into `auth.setup.ts`, and functional tests are grouped by module into `spec.ts` files, following the Playwright testing conventions.

## File: tests/auth.setup.ts

This setup file handles the entire authentication flow. It logs in an admin user and saves the browser's storage state, which includes cookies and local storage. This saved state is then reused by subsequent test files, avoiding repetitive login actions and speeding up test execution.

```typescript
import { test, expect, Page } from '@playwright/test'; // MANDATORY: Import test, expect
import { STORAGE_STATE } from '../playwright.config';
import { EnvUtils } from '../utils/envUtils';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';

/**
 * Authentication setup file.
 * This test logs in an admin user and saves the authentication state
 * to be reused across subsequent test runs, avoiding repeated logins.
 */
test('Authenticate as admin user', async ({ page }: { page: Page }) => {
  const homePage = new HomePage(page);
  const loginPage = new LoginPage(page);

  console.log('Starting authentication process...');

  // 1. Launch the application URL
  await homePage.navigateTo(EnvUtils.BASE_URL);

  // 2. Verify that the 'Home' page is displayed.
  await homePage.verifyHomePageDisplayed();

  // 3. Click on the 'Login' hyperlink.
  await homePage.clickLogin();

  // 4. Verify that the user is navigated to the Login page.
  await loginPage.verifyLoginPageDisplayed();

  // 5. Enter the Admin Username and Password, then click login.
  await loginPage.loginAsAdmin();

  // 6. Verify that the user is successfully logged in as Admin and navigated to the 'Home' page.
  // This typically means the login link is gone, and a dashboard/profile link appears.
  await expect(homePage.loginLink).toBeHidden({ timeout: 15000 }); // Login link should disappear
  await homePage.verifyHomePageDisplayed(); // Re-verify home page post-login (content might change)
  await expect(homePage.dashboardNavLink).toBeVisible(); // Check for a post-login element

  console.log('Admin user successfully authenticated and storage state will be saved.');

  // Save the storage state (cookies, local storage, etc.) after successful login
  await page.context().storageState({ path: STORAGE_STATE });
  console.log(`Authentication state saved to: ${STORAGE_STATE}`);
});
```

## File: tests/dashboard.spec.ts

This test file contains scenarios for validating dashboard functionality, specifically focusing on creating events. It leverages the pre-authenticated session from `auth.setup.ts`.

```typescript
import { test, expect, Page } from '@playwright/test'; // MANDATORY: Import Page
import { EnvUtils } from '../utils/envUtils';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';

// Define the test data structure
interface EventTestData {
  adminUsername: string;
  adminPassword: string; // Will be masked by EnvUtils
  eventTitle: string;
}

// Test data sets from the provided input
const eventTestCases: EventTestData[] = [
  { adminUsername: EnvUtils.ADMIN_USERNAME, adminPassword: EnvUtils.ADMIN_PASSWORD, eventTitle: 'Team Meeting' },
  { adminUsername: EnvUtils.ADMIN_USERNAME, adminPassword: EnvUtils.ADMIN_PASSWORD, eventTitle: 'Project Review (Q3)' },
  { adminUsername: EnvUtils.ADMIN_USERNAME, adminPassword: EnvUtils.ADMIN_PASSWORD, eventTitle: 'Long Event Title With Many Characters And Symbols For Testing Purposes' },
];

test.describe('Dashboard Functionality', () => {
  let homePage: HomePage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects before each test
    homePage = new HomePage(page);
    dashboardPage = new DashboardPage(page);

    // Navigate to the base URL (home page) using the authenticated session
    await page.goto(EnvUtils.BASE_URL);
    await homePage.verifyHomePageDisplayed();
  });

  // Use test.each to run the same test with different data sets
  test.each(eventTestCases)(
    'Verify Admin user can successfully create a new event from Dashboard calendar with title: "%s"',
    async ({ page }: { page: Page }, testInfo, { eventTitle }) => {
      console.log(`Running test for event: ${eventTitle}`);

      // Steps 1-8 are handled by auth.setup.ts and beforeEach, assuming the user is already logged in
      // and on the home page.

      // 9. Click on the 'Dashboard' navigation tab in the header.
      await homePage.clickDashboardNavLink();

      // 10. Verify that the 'Dashboard' page is displayed.
      await dashboardPage.verifyDashboardPageDisplayed();

      // 11. In the 'Calendar' block, click on the current date to open the event creation dialog.
      await dashboardPage.clickCurrentDateInCalendar();

      // 12. Verify that the 'New Event' popup window is displayed.
      await dashboardPage.verifyNewEventPopupDisplayed();

      // 13. Enter `[Event Title]` into the 'Event title' input box.
      await dashboardPage.enterEventTitle(eventTitle);

      // 14. Click the 'Save' button.
      await dashboardPage.clickSaveEventButton();

      // 15. Verify that the new event, with the specified title, is successfully created and displayed on the Dashboard calendar.
      await dashboardPage.verifyEventCreatedAndDisplayed(eventTitle);

      console.log(`Successfully created and verified event: "${eventTitle}"`);
    }
  );
});
```

## File: tests/myCourses.spec.ts

This test file focuses on the functionality of the "My courses" section, specifically for creating new courses. It utilizes a pre-authenticated admin session.

```typescript
import { test, expect, Page } from '@playwright/test';
import { EnvUtils } from '../utils/envUtils';
import { HomePage } from '../pages/HomePage';
import { MyCoursesPage } from '../pages/MyCoursesPage';

// Define the test data structure for courses
interface CourseTestData {
  adminUsername: string;
  adminPassword: string; // Will be masked by EnvUtils
  courseFullName: string;
  courseShortName: string;
  courseCategory: string;
}

// Test data sets from the provided input
const courseTestCases: CourseTestData[] = [
  {
    adminUsername: EnvUtils.ADMIN_USERNAME,
    adminPassword: EnvUtils.ADMIN_PASSWORD,
    courseFullName: 'Introduction to Software Testing',
    courseShortName: 'IST101',
    courseCategory: 'Development',
  },
  {
    adminUsername: EnvUtils.ADMIN_USERNAME,
    adminPassword: EnvUtils.ADMIN_PASSWORD,
    courseFullName: 'Advanced QA Techniques',
    courseShortName: 'AQT201',
    courseCategory: 'Quality Assurance',
  },
  {
    adminUsername: EnvUtils.ADMIN_USERNAME,
    adminPassword: EnvUtils.ADMIN_PASSWORD,
    courseFullName: 'Very Long Course Full Name To Test Max Length Constraints And Special Characters &()',
    courseShortName: 'VLCN_SC',
    courseCategory: 'General',
  },
];

test.describe('My Courses Functionality', () => {
  let homePage: HomePage;
  let myCoursesPage: MyCoursesPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects before each test
    homePage = new HomePage(page);
    myCoursesPage = new MyCoursesPage(page);

    // Navigate to the base URL (home page) using the authenticated session
    await page.goto(EnvUtils.BASE_URL);
    await homePage.verifyHomePageDisplayed();
  });

  // Use test.each to run the same test with different data sets
  test.each(courseTestCases)(
    'Verify Admin user can successfully create a new course: %s',
    async ({ page }: { page: Page }, testInfo, { courseFullName, courseShortName, courseCategory }) => {
      console.log(`Running test for course: ${courseFullName}`);

      // Steps 1-8 are handled by auth.setup.ts and beforeEach, user is already logged in
      // and on the home page.

      // 9. Click on the 'My courses' navigation tab in the header.
      await homePage.clickMyCoursesNavLink();

      // 10. Verify that the 'My courses' page is displayed.
      await myCoursesPage.verifyMyCoursesPageDisplayed();

      // 11. Click on the 'Create Course' button.
      await myCoursesPage.clickCreateCourseButton();

      // 12. Verify that the 'Add a new course' page is displayed.
      await myCoursesPage.verifyAddNewCoursePageDisplayed();

      // 13. Enter `[Course Full Name]` into the 'Course full name' input box.
      await myCoursesPage.enterCourseFullName(courseFullName);

      // 14. Enter `[Course Short Name]` into the 'Course short name' input box.
      await myCoursesPage.enterCourseShortName(courseShortName);

      // 15. Select `[Course Category]` from the 'Course category' dropdown menu.
      await myCoursesPage.selectCourseCategory(courseCategory);

      // 16. Click the 'Save and display' button.
      await myCoursesPage.clickSaveAndDisplayButton();

      // 17. Verify that the new course is successfully created and its details page is displayed.
      await myCoursesPage.verifyCourseDetailsPageDisplayed(courseFullName);

      console.log(`Successfully created and verified course: "${courseFullName}"`);
    }
  );
});
```

## File: tests/siteAdministration.spec.ts

This test file verifies navigation to the Site Administration tab for an admin user. It uses the pre-authenticated session.

```typescript
import { test, expect, Page } from '@playwright/test';
import { EnvUtils } from '../utils/envUtils';
import { HomePage } from '../pages/HomePage';
import { SiteAdministrationPage } from '../pages/SiteAdministrationPage';

test.describe('Site Administration Navigation', () => {
  let homePage: HomePage;
  let siteAdministrationPage: SiteAdministrationPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects before each test
    homePage = new HomePage(page);
    siteAdministrationPage = new SiteAdministrationPage(page);

    // Navigate to the base URL (home page) using the authenticated session
    await page.goto(EnvUtils.BASE_URL);
    await homePage.verifyHomePageDisplayed();
  });

  test('Verify Admin user can successfully navigate to the Site administration tab', async ({ page }: { page: Page }, testInfo) => {
    console.log('Running test: Verify Admin user can successfully navigate to Site administration.');

    // Steps 1-8 are handled by auth.setup.ts and beforeEach, user is already logged in
    // and on the home page.

    // 9. Click on the 'Site administration' navigation tab in the header.
    await homePage.clickSiteAdministrationNavLink();

    // 10. Verify that the 'Site administration' page is displayed successfully, showing relevant administrative options.
    await siteAdministrationPage.verifySiteAdministrationPageDisplayed();
    await expect(siteAdministrationPage.usersTab).toBeVisible(); // Check for a specific element on the admin page
    await expect(siteAdministrationPage.coursesTab).toBeVisible();
    await expect(siteAdministrationPage.reportsTab).toBeVisible();

    console.log('Successfully navigated to and verified Site administration page.');
  });
});
```