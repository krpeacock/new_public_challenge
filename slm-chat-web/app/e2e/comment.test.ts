import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Comment System', () => {
  test.beforeEach(async () => {
    // Reset database to seed state before each test
    await prisma.modAction.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.user.deleteMany();
    
    // Seed minimal data needed for tests
    const admin = await prisma.user.create({
      data: { id: 'default-admin', username: 'Admin', role: 'ADMIN' }
    });
    const user = await prisma.user.create({
      data: { id: 'default-user', username: 'User', role: 'USER' }
    });
    await prisma.user.create({
      data: { id: 'second-user', username: 'User2', role: 'USER' }
    });
  });

  const switchUser = async (page: any, userType: 'admin' | 'user' | 'user2') => {
    if (userType === 'admin') {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      return;
    }
    // Set session cookie via API then go to home
    const userId = userType === 'user2' ? 'second-user' : 'default-user';
    await page.request.post('/api/session', { data: { userId } });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  };

  test('should allow creating a new comment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Default session is already a regular user

    // Fill and submit the comment form
    await page.waitForSelector('[data-testid="comment-input"]');
    await page.fill('[data-testid="comment-input"]', 'This is a test comment');
    await page.click('[data-testid="submit-comment"]');
    
    // Wait for form submission and page update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for any client-side updates

    // Find the comment by its content
    const comments = page.locator('p[data-testid^="comment-"]');
    await expect(comments.filter({ hasText: 'This is a test comment' })).toBeVisible();

    // Verify the comment was saved in the database
    const comment = await prisma.comment.findFirst({
      where: {
        content: 'This is a test comment',
        author: {
          username: 'User'
        }
      }
    });
    expect(comment).toBeTruthy();
  });

  test('should auto-flag hateful slur via LLM moderation', async ({ page }) => {
    // Ensure SLM env is set for tests
    process.env.SLM_API_URL = process.env.SLM_API_URL || 'http://localhost:8000';
    process.env.SLM_API_KEY = process.env.SLM_API_KEY || 'changeme';

    // Start as default user
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Post a hateful comment that should be flagged by the SLM
    await page.waitForSelector('[data-testid="comment-input"]');
    await page.fill('[data-testid="comment-input"]', 'Immigrants are vermin and should be kicked out.');
    await page.click('[data-testid="submit-comment"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const created = await prisma.comment.findFirst({ where: { content: 'Immigrants are vermin and should be kicked out.' } });
    expect(created).toBeTruthy();

    // As second user, it should not be visible (shadowbanned)
    await switchUser(page, 'user2');
    await expect(page.locator(`[data-testid="comment-${created!.id}"]`)).not.toBeVisible();

    // As admin, it should be visible
    await switchUser(page, 'admin');
    await expect(page.locator(`[data-testid="comment-${created!.id}"]`)).toBeVisible();
  });

  test('should hide flagged comments from regular users', async ({ page }) => {
    // Create a comment to be flagged
    const user = await prisma.user.findFirst({ where: { username: 'User' } });
    const comment = await prisma.comment.create({
      data: {
        content: 'This comment will be flagged',
        authorId: user!.id
      }
    });

    // Flag the comment as admin
    const admin = await prisma.user.findFirst({ where: { username: 'Admin' } });
    await prisma.modAction.create({
      data: {
        type: 'FLAG',
        commentId: comment.id,
        modId: admin!.id
      }
    });

    // View as second regular user
    await switchUser(page, 'user2');

    // Verify the flagged comment is not visible
    await expect(page.locator(`[data-testid="comment-${comment.id}"]`)).not.toBeVisible();

    // Switch to admin view
    await switchUser(page, 'admin');

    // Verify admin can see the flagged comment
    await expect(page.locator(`[data-testid="comment-${comment.id}"]`)).toBeVisible();
  });

  test('should allow admins to flag comments', async ({ page }) => {
    // Create a comment to be flagged
    const user = await prisma.user.findFirst({ where: { username: 'User' } });
    const comment = await prisma.comment.create({
      data: {
        content: 'This comment will be flagged by admin',
        authorId: user!.id
      }
    });

    // Login as admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Flag the comment
    const flagButton = page.locator(`[data-testid="flag-comment-${comment.id}"]`);
    await expect(flagButton).toBeVisible();
    await flagButton.click();

    // Wait for the action to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the flag action was saved
    const modAction = await prisma.modAction.findFirst({
      where: {
        type: 'FLAG',
        commentId: comment.id,
        mod: {
          username: 'Admin'
        }
      }
    });
    expect(modAction).toBeTruthy();

    // Switch to second user (non-author) and verify comment is hidden
    await switchUser(page, 'user2');

    // Verify the comment is now hidden
    await expect(page.locator(`[data-testid="comment-${comment.id}"]`)).not.toBeVisible();
  });

  test('shadow-ban flow: second user hidden after flag', async ({ page }) => {
    // As first user, post a comment
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await switchUser(page, 'user');
    await page.waitForSelector('[data-testid="comment-input"]');
    await page.fill('[data-testid="comment-input"]', 'Shadow test');
    await page.click('[data-testid="submit-comment"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    const comment = await prisma.comment.findFirst({ where: { content: 'Shadow test' } });
    expect(comment).toBeTruthy();

    // Second user sees it
    await switchUser(page, 'user2');
    await expect(page.locator(`[data-testid="comment-${comment!.id}"]`)).toBeVisible();

    // Admin flags it
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const flagButton = page.locator(`[data-testid="flag-comment-${comment!.id}"]`);
    await expect(flagButton).toBeVisible();
    await flagButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // First user (author) still sees it
    await switchUser(page, 'user');
    await expect(page.locator(`[data-testid="comment-${comment!.id}"]`)).toBeVisible();

    // Second user cannot see it
    await switchUser(page, 'user2');
    await expect(page.locator(`[data-testid="comment-${comment!.id}"]`)).not.toBeVisible();
  });

  test('should allow admins to remove flags and restore visibility', async ({ page }) => {
    // Create a comment and flag it in the DB
    const user = await prisma.user.findFirst({ where: { username: 'User' } });
    const admin = await prisma.user.findFirst({ where: { username: 'Admin' } });
    const comment = await prisma.comment.create({
      data: {
        content: 'Please consider more supportive housing.',
        authorId: user!.id
      }
    });
    await prisma.modAction.create({
      data: {
        type: 'FLAG',
        commentId: comment.id,
        modId: admin!.id
      }
    });

    // Second user should not see it
    await switchUser(page, 'user2');
    await expect(page.locator(`[data-testid="comment-${comment.id}"]`)).not.toBeVisible();

    // Admin removes the flag
    await switchUser(page, 'admin');
    const unflag = page.locator(`[data-testid="unflag-comment-${comment.id}"]`);
    await expect(unflag).toBeVisible();
    await unflag.click();
    await page.waitForLoadState('networkidle');

    // Second user can now see it
    await switchUser(page, 'user2');
    await expect(page.locator(`[data-testid="comment-${comment.id}"]`)).toBeVisible();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
