CREATE TABLE `expenses` (
	`expense_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`is_essential` integer DEFAULT false NOT NULL,
	`vault_source` text DEFAULT 'SAFE_TO_SPEND' NOT NULL,
	`occurred_at` text NOT NULL,
	`client_generated_id` text NOT NULL,
	`sync_state` text DEFAULT 'SYNCED' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_client_generated_id_unique` ON `expenses` (`client_generated_id`);--> statement-breakpoint
CREATE TABLE `income_events` (
	`income_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`received_at` text NOT NULL,
	`is_confirmed` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`vault` text NOT NULL,
	`amount` integer NOT NULL,
	`subscription_id` text,
	`expense_id` text,
	`occurred_at` text NOT NULL,
	`client_generated_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`subscription_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_client_generated_id_unique` ON `ledger` (`client_generated_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`subscription_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`monthly_amount` integer NOT NULL,
	`frequency` text DEFAULT 'MONTHLY' NOT NULL,
	`due_day_of_month` integer NOT NULL,
	`template_key` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`income_type` text DEFAULT 'FIXED' NOT NULL,
	`fixed_weekly_amount` integer,
	`savings_percentage` real DEFAULT 0 NOT NULL,
	`essential_weekly_baseline_minor` integer,
	`payday_weekday` text DEFAULT 'MONDAY' NOT NULL,
	`week_start_weekday` text DEFAULT 'MONDAY' NOT NULL,
	`currency_code` text DEFAULT 'PHP' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
